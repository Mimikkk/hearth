import { Attribute, Color, Geometry, Vec3 } from '@modules/renderer/engine/engine.js';

function isBinary(data: ArrayBuffer) {
  const reader = new DataView(data);
  const face_size = (32 / 8) * 3 + (32 / 8) * 3 * 3 + 16 / 8;
  const n_faces = reader.getUint32(80, true);
  const expect = 80 + 32 / 8 + n_faces * face_size;

  if (expect === reader.byteLength) {
    return true;
  }











  const solid = [115, 111, 108, 105, 100];

  for (let off = 0; off < 5; off++) {

    if (matchDataViewAt(solid, reader, off)) return false;
  }

  return true;
}

function matchDataViewAt(query: number[], reader: DataView, offset: number) {
  for (let i = 0, il = query.length; i < il; i++) {
    if (query[i] !== reader.getUint8(offset + i)) return false;
  }

  return true;
}

function parseBinary(buffer: ArrayBuffer) {
  const reader = new DataView(buffer);
  const faces = reader.getUint32(80, true);

  let r!: number;
  let g!: number;
  let b!: number;
  let colors: Float32Array | undefined;
  let defaultR!: number;
  let defaultG!: number;
  let defaultB!: number;
  let alpha!: number;




  for (let index = 0; index < 80 - 10; index++) {
    if (
      reader.getUint32(index, false) == 0x434f4c4f /*COLO*/ &&
      reader.getUint8(index + 4) == 0x52 /*'R'*/ &&
      reader.getUint8(index + 5) == 0x3d /*'='*/
    ) {
      colors = new Float32Array(faces * 3 * 3);

      defaultR = reader.getUint8(index + 6) / 255;
      defaultG = reader.getUint8(index + 7) / 255;
      defaultB = reader.getUint8(index + 8) / 255;
      alpha = reader.getUint8(index + 9) / 255;
    }
  }

  const dataOffset = 84;
  const faceLength = 12 * 4 + 2;

  const geometry = new Geometry();

  const vertices = new Float32Array(faces * 3 * 3);
  const normals = new Float32Array(faces * 3 * 3);

  const color = Color.new();

  for (let face = 0; face < faces; face++) {
    const start = dataOffset + face * faceLength;
    const normalX = reader.getFloat32(start, true);
    const normalY = reader.getFloat32(start + 4, true);
    const normalZ = reader.getFloat32(start + 8, true);

    if (colors) {
      const packedColor = reader.getUint16(start + 48, true);

      if ((packedColor & 0x8000) === 0) {


        r = (packedColor & 0x1f) / 31;
        g = ((packedColor >> 5) & 0x1f) / 31;
        b = ((packedColor >> 10) & 0x1f) / 31;
      } else {
        r = defaultR;
        g = defaultG;
        b = defaultB;
      }
    }

    for (let i = 1; i <= 3; i++) {
      const vertexstart = start + i * 12;
      const componentIdx = face * 3 * 3 + (i - 1) * 3;

      vertices[componentIdx] = reader.getFloat32(vertexstart, true);
      vertices[componentIdx + 1] = reader.getFloat32(vertexstart + 4, true);
      vertices[componentIdx + 2] = reader.getFloat32(vertexstart + 8, true);

      normals[componentIdx] = normalX;
      normals[componentIdx + 1] = normalY;
      normals[componentIdx + 2] = normalZ;

      if (colors) {
        color.set(r, g, b).asSRGBToLinear();

        colors[componentIdx] = color.r;
        colors[componentIdx + 1] = color.g;
        colors[componentIdx + 2] = color.b;
      }
    }
  }

  geometry.setAttribute('position', new Attribute(vertices, 3));
  geometry.setAttribute('normal', new Attribute(normals, 3));

  if (colors) {
    geometry.setAttribute('color', new Attribute(colors, 3));
    //@ts-expect-error
    geometry.hasColors = true;
    //@ts-expect-error
    geometry.alpha = alpha;
  }

  return geometry;
}

function parseASCII(text: string) {
  const geometry = new Geometry();
  const patternSolid = /solid([\s\S]*?)endsolid/g;
  const patternFace = /facet([\s\S]*?)endfacet/g;
  const patternName = /solid\s(.+)/;
  let faceCounter = 0;

  const patternFloat = /[\s]+([+-]?(?:\d*)(?:\.\d*)?(?:[eE][+-]?\d+)?)/.source;
  const patternVertex = new RegExp('vertex' + patternFloat + patternFloat + patternFloat, 'g');
  const patternNormal = new RegExp('normal' + patternFloat + patternFloat + patternFloat, 'g');

  const vertices = [];
  const normals = [];
  const groupNames = [];

  const normal = Vec3.new();

  let result;

  let groupCount = 0;
  let startVertex = 0;
  let endVertex = 0;

  while ((result = patternSolid.exec(text)) !== null) {
    startVertex = endVertex;

    const solid = result[0];

    const name = (result = patternName.exec(solid)) !== null ? result[1] : '';
    groupNames.push(name);

    while ((result = patternFace.exec(solid)) !== null) {
      let vertexCountPerFace = 0;
      let normalCountPerFace = 0;

      const text = result[0];

      while ((result = patternNormal.exec(text)) !== null) {
        normal.x = parseFloat(result[1]);
        normal.y = parseFloat(result[2]);
        normal.z = parseFloat(result[3]);
        normalCountPerFace++;
      }

      while ((result = patternVertex.exec(text)) !== null) {
        vertices.push(parseFloat(result[1]), parseFloat(result[2]), parseFloat(result[3]));
        normals.push(normal.x, normal.y, normal.z);
        vertexCountPerFace++;
        endVertex++;
      }



      if (normalCountPerFace !== 1) {
        console.error("STLLoader: Something isn't right with the normal of face number " + faceCounter);
      }



      if (vertexCountPerFace !== 3) {
        console.error("STLLoader: Something isn't right with the vertices of face number " + faceCounter);
      }

      faceCounter++;
    }

    const start = startVertex;
    const count = endVertex - startVertex;

    geometry.userData.groupNames = groupNames;

    geometry.addGroup(start, count, groupCount);
    groupCount++;
  }

  geometry.setAttribute('position', new Attribute(new Float32Array(vertices), 3));
  geometry.setAttribute('normal', new Attribute(new Float32Array(normals), 3));

  return geometry;
}

export const parseSTL = (buffer: ArrayBuffer) =>
  isBinary(buffer) ? parseBinary(buffer) : parseASCII(new TextDecoder().decode(buffer));
