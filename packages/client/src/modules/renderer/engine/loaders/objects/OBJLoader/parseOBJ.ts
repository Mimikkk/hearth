import {
  Attribute,
  Color,
  Geometry,
  Group,
  LineBasicMaterial,
  LineSegments,
  Material,
  Mesh,
  MeshPhongMaterial,
  Points,
  PointsMaterial,
  Vec3,
} from '@modules/renderer/engine/engine.js';
import { MTLMaterialCreator } from '@modules/renderer/engine/loaders/objects/OBJLoader/MTLLoader/MTLMaterialCreator.js';

const ObjectRe = /^[og]\s*(.+)?/;

const MaterialLibRe = /^mtllib /;

const MaterialUseRe = /^usemtl /;

const MapUseRe = /^usemap /;
const DelimiterRe = /\s+/;

const _vA = Vec3.new();
const _vB = Vec3.new();
const _vC = Vec3.new();
const _ab = Vec3.new();
const _cb = Vec3.new();
const _color = Color.new();

class ParserState {
  objects = [];
  object = {};

  vertices: number[] = [];
  normals: number[] = [];
  colors: number[] = [];
  uvs: number[] = [];

  materials = {};
  materialLibraries = [];

  startObject(name: string, fromDeclaration: boolean) {


    if (this.object && this.object.fromDeclaration === false) {
      this.object.name = name;
      this.object.fromDeclaration = fromDeclaration !== false;
      return;
    }

    const previousMaterial =
      this.object && typeof this.object.currentMaterial === 'function' ? this.object.currentMaterial() : undefined;

    if (this.object && typeof this.object._finalize === 'function') {
      this.object._finalize(true);
    }

    this.object = {
      name: name || '',
      fromDeclaration: fromDeclaration !== false,

      geometry: {
        vertices: [],
        normals: [],
        colors: [],
        uvs: [],
        hasUVIndices: false,
      },
      materials: [],
      smooth: true,

      startMaterial(name: string, libraries: string[]) {
        const previous = this._finalize(false);



        if (previous && (previous.inherited || previous.groupCount <= 0)) {
          this.materials.splice(previous.index, 1);
        }

        const material = {
          index: this.materials.length,
          name: name || '',
          mtllib: Array.isArray(libraries) && libraries.length > 0 ? libraries[libraries.length - 1] : '',
          smooth: previous !== undefined ? previous.smooth : this.smooth,
          groupStart: previous !== undefined ? previous.groupEnd : 0,
          groupEnd: -1,
          groupCount: -1,
          inherited: false,

          clone(index: number) {
            const cloned = {
              index: typeof index === 'number' ? index : this.index,
              name: this.name,
              mtllib: this.mtllib,
              smooth: this.smooth,
              groupStart: 0,
              groupEnd: -1,
              groupCount: -1,
              inherited: false,
            };
            cloned.clone = this.clone.bind(cloned);
            return cloned;
          },
        };

        this.materials.push(material);

        return material;
      },

      currentMaterial() {
        if (this.materials.length > 0) {
          return this.materials[this.materials.length - 1];
        }

        return undefined;
      },

      _finalize(end) {
        const lastMultiMaterial = this.currentMaterial();
        if (lastMultiMaterial && lastMultiMaterial.groupEnd === -1) {
          lastMultiMaterial.groupEnd = this.geometry.vertices.length / 3;
          lastMultiMaterial.groupCount = lastMultiMaterial.groupEnd - lastMultiMaterial.groupStart;
          lastMultiMaterial.inherited = false;
        }


        if (end && this.materials.length > 1) {
          for (let mi = this.materials.length - 1; mi >= 0; mi--) {
            if (this.materials[mi].groupCount <= 0) {
              this.materials.splice(mi, 1);
            }
          }
        }


        if (end && this.materials.length === 0) {
          this.materials.push({
            name: '',
            smooth: this.smooth,
          });
        }

        return lastMultiMaterial;
      },
    };







    if (previousMaterial && previousMaterial.name && typeof previousMaterial.clone === 'function') {
      const declared = previousMaterial.clone(0);
      declared.inherited = true;
      this.object.materials.push(declared);
    }

    this.objects.push(this.object);
  }

  finalize() {
    if (this.object && typeof this.object._finalize === 'function') {
      this.object._finalize(true);
    }
  }

  parseVertexIndex(value: string, len: number): number {
    const index = parseInt(value, 10);
    return (index >= 0 ? index - 1 : index + len / 3) * 3;
  }

  parseNormalIndex(value: string, len: number): number {
    const index = parseInt(value, 10);
    return (index >= 0 ? index - 1 : index + len / 3) * 3;
  }

  parseUVIndex(value: string, len: number): number {
    const index = parseInt(value, 10);
    return (index >= 0 ? index - 1 : index + len / 2) * 2;
  }

  addVertex(a: number, b: number, c: number) {
    const src = this.vertices;
    const dst = this.object.geometry.vertices;

    dst.push(src[a + 0], src[a + 1], src[a + 2]);
    dst.push(src[b + 0], src[b + 1], src[b + 2]);
    dst.push(src[c + 0], src[c + 1], src[c + 2]);
  }

  addVertexPoint(a: number) {
    const src = this.vertices;
    const dst = this.object.geometry.vertices;

    dst.push(src[a + 0], src[a + 1], src[a + 2]);
  }

  addVertexLine(a: number) {
    const src = this.vertices;
    const dst = this.object.geometry.vertices;

    dst.push(src[a + 0], src[a + 1], src[a + 2]);
  }

  addNormal(a: number, b: number, c: number) {
    const src = this.normals;
    const dst = this.object.geometry.normals;

    dst.push(src[a + 0], src[a + 1], src[a + 2]);
    dst.push(src[b + 0], src[b + 1], src[b + 2]);
    dst.push(src[c + 0], src[c + 1], src[c + 2]);
  }

  addFaceNormal(a: number, b: number, c: number) {
    const src = this.vertices;
    const dst = this.object.geometry.normals;

    _vA.fromArray(src, a);
    _vB.fromArray(src, b);
    _vC.fromArray(src, c);

    _cb.asSub(_vC, _vB);
    _ab.asSub(_vA, _vB);
    _cb.cross(_ab);

    _cb.normalize();

    dst.push(_cb.x, _cb.y, _cb.z);
    dst.push(_cb.x, _cb.y, _cb.z);
    dst.push(_cb.x, _cb.y, _cb.z);
  }

  addColor(a?: number, b?: number, c?: number) {
    const src = this.colors;
    const dst = this.object.geometry.colors;

    if (a !== undefined && src[a] !== undefined) dst.push(src[a + 0], src[a + 1], src[a + 2]);
    if (b !== undefined && src[b] !== undefined) dst.push(src[b + 0], src[b + 1], src[b + 2]);
    if (c !== undefined && src[c] !== undefined) dst.push(src[c + 0], src[c + 1], src[c + 2]);
  }

  addUV(a: number, b: number, c: number) {
    const src = this.uvs;
    const dst = this.object.geometry.uvs;

    dst.push(src[a + 0], src[a + 1]);
    dst.push(src[b + 0], src[b + 1]);
    dst.push(src[c + 0], src[c + 1]);
  }

  addDefaultUV() {
    const dst = this.object.geometry.uvs;

    dst.push(0, 0);
    dst.push(0, 0);
    dst.push(0, 0);
  }

  addUVLine(a: number) {
    const src = this.uvs;
    const dst = this.object.geometry.uvs;

    dst.push(src[a + 0], src[a + 1]);
  }

  addFace(a: string, b: string, c: string, ua: string, ub: string, uc: string, na: string, nb: string, nc: string) {
    const vLen = this.vertices.length;

    let ia = this.parseVertexIndex(a, vLen);
    let ib = this.parseVertexIndex(b, vLen);
    let ic = this.parseVertexIndex(c, vLen);

    this.addVertex(ia, ib, ic);
    this.addColor(ia, ib, ic);



    if (na !== undefined && na !== '') {
      const nLen = this.normals.length;

      ia = this.parseNormalIndex(na, nLen);
      ib = this.parseNormalIndex(nb, nLen);
      ic = this.parseNormalIndex(nc, nLen);

      this.addNormal(ia, ib, ic);
    } else {
      this.addFaceNormal(ia, ib, ic);
    }



    if (ua !== undefined && ua !== '') {
      const uvLen = this.uvs.length;

      ia = this.parseUVIndex(ua, uvLen);
      ib = this.parseUVIndex(ub, uvLen);
      ic = this.parseUVIndex(uc, uvLen);

      this.addUV(ia, ib, ic);

      this.object.geometry.hasUVIndices = true;
    } else {


      this.addDefaultUV();
    }
  }

  addPointGeometry(vertices: string[]) {
    this.object.geometry.type = 'Poi.js';

    const vLen = this.vertices.length;

    for (let vi = 0, l = vertices.length; vi < l; vi++) {
      const index = this.parseVertexIndex(vertices[vi], vLen);

      this.addVertexPoint(index);
      this.addColor(index);
    }
  }

  addLineGeometry(vertices: string[], uvs: string[]) {
    this.object.geometry.type = 'Line';

    const vLen = this.vertices.length;
    const uvLen = this.uvs.length;

    for (let vi = 0, l = vertices.length; vi < l; vi++) {
      this.addVertexLine(this.parseVertexIndex(vertices[vi], vLen));
    }

    for (let uvi = 0, l = uvs.length; uvi < l; uvi++) {
      this.addUVLine(this.parseUVIndex(uvs[uvi], uvLen));
    }
  }

  constructor() {
    this.startObject('', false);
  }
}

export const enum OBJToken {
  Vertex = 'v',
  Normal = 'vn',
  UV = 'vt',
  Face = 'f',
  Line = 'l',
  Point = 'p',
  Group = 'g',
  Object = 'o',
  Material = 'usemtl',
  MaterialLibrary = 'mtllib',
  Smooth = 's',
  Comment = '#',
}

export async function parseOBJ(text: string, materialCreator?: MTLMaterialCreator): Promise<Group> {
  const state = new ParserState();

  if (text.indexOf('\r\n') !== -1) {

    text = text.replace(/\r\n/g, '\n');
  }

  if (text.indexOf('\\\n') !== -1) {

    text = text.replace(/\\\n/g, '');
  }

  const lines = text.split('\n');
  let result = [];

  for (let i = 0, l = lines.length; i < l; i++) {
    const line = lines[i].trimStart();

    if (line.length === 0) continue;

    const lineFirstChar = line.charAt(0);

    if (lineFirstChar === OBJToken.Comment) continue;
    if (lineFirstChar === OBJToken.Vertex) {
      const data = line.split(DelimiterRe);

      switch (data[0]) {
        case OBJToken.Vertex:
          state.vertices.push(+data[1], +data[2], +data[3]);
          if (data.length >= 7) {
            _color.setRGB(+data[4], +data[5], +data[6]).asSRGBToLinear();

            state.colors.push(_color.r, _color.g, _color.b);
          } else {


            state.colors.push(undefined, undefined, undefined);
          }

          break;
        case 'vn':
          state.normals.push(+data[1], +data[2], +data[3]);
          break;
        case 'vt':
          state.uvs.push(+data[1], +data[2]);
          break;
      }
    } else if (lineFirstChar === 'f') {
      const lineData = line.slice(1).trim();
      const vertexData = lineData.split(DelimiterRe);
      const faceVertices = [];



      for (let j = 0, jl = vertexData.length; j < jl; j++) {
        const vertex = vertexData[j];

        if (vertex.length > 0) {
          const vertexParts = vertex.split('/');
          faceVertices.push(vertexParts);
        }
      }



      const v1 = faceVertices[0];

      for (let j = 1, jl = faceVertices.length - 1; j < jl; j++) {
        const v2 = faceVertices[j];
        const v3 = faceVertices[j + 1];

        state.addFace(v1[0], v2[0], v3[0], v1[1], v2[1], v3[1], v1[2], v2[2], v3[2]);
      }
    } else if (lineFirstChar === 'l') {
      const lineParts = line.substring(1).trim().split(' ');
      let lineVertices = [];
      const lineUVs = [];

      if (line.indexOf('/') === -1) {
        lineVertices = lineParts;
      } else {
        for (let li = 0, llen = lineParts.length; li < llen; li++) {
          const parts = lineParts[li].split('/');

          if (parts[0] !== '') lineVertices.push(parts[0]);
          if (parts[1] !== '') lineUVs.push(parts[1]);
        }
      }

      state.addLineGeometry(lineVertices, lineUVs);
    } else if (lineFirstChar === 'p') {
      const lineData = line.slice(1).trim();
      const pointData = lineData.split(' ');

      state.addPointGeometry(pointData);
    } else if ((result = ObjectRe.exec(line)) !== null) {






      const name = (' ' + result[0].slice(1).trim()).slice(1);

      state.startObject(name);
    } else if (MaterialUseRe.test(line)) {


      state.object.startMaterial(line.substring(7).trim(), state.materialLibraries);
    } else if (MaterialLibRe.test(line)) {


      state.materialLibraries.push(line.substring(7).trim());
    } else if (MapUseRe.test(line)) {



      console.warn(
        'engine.OBJLoader: Rendering identifier "usemap" not supported. Textures must be defined in MTL files.',
      );
    } else if (lineFirstChar === 's') {
      result = line.split(' ');










      /*
       * http://paulbourke.net/dataformats/obj/
       *
       * From chapter "Grouping" Syntax explanation "s group_number":
       * "group_number is the smoothing group number. To turn off smoothing groups, use a value of 0 or off.
       * Polygonal elements use group numbers to put elements in different smoothing groups. For free-form
       * surfaces, smoothing groups are either turned on or off; there is no difference between values greater
       * than 0."
       */
      if (result.length > 1) {
        const value = result[1].trim().toLowerCase();
        state.object.smooth = value !== '0' && value !== 'off';
      } else {

        state.object.smooth = true;
      }

      const material = state.object.currentMaterial();
      if (material) material.smooth = state.object.smooth;
    } else {

      if (line === '\0') continue;

      console.warn('engine.OBJLoader: Unexpected line: "' + line + '"');
    }
  }

  state.finalize();

  const container = new Group();

  const hasPrimitives = !(state.objects.length === 1 && state.objects[0].geometry.vertices.length === 0);

  if (hasPrimitives === true) {
    for (let i = 0, l = state.objects.length; i < l; i++) {
      const object = state.objects[i];
      const geometry = object.geometry;
      const materials = object.materials;
      const isLine = geometry.type === 'Line';
      const isPoints = geometry.type === 'Poi.js';
      let hasVertexColors = false;


      if (geometry.vertices.length === 0) continue;

      const buffergeometry = new Geometry();

      buffergeometry.setAttribute('position', new Attribute(new Float32Array(geometry.vertices), 3));

      if (geometry.normals.length > 0) {
        buffergeometry.setAttribute('normal', new Attribute(new Float32Array(geometry.normals), 3));
      }

      if (geometry.colors.length > 0) {
        hasVertexColors = true;
        buffergeometry.setAttribute('color', new Attribute(new Float32Array(geometry.colors), 3));
      }

      if (geometry.hasUVIndices === true) {
        buffergeometry.setAttribute('uv', new Attribute(new Float32Array(geometry.uvs), 2));
      }



      const createdMaterials = [];

      for (let mi = 0, miLen = materials.length; mi < miLen; mi++) {
        const sourceMaterial = materials[mi];
        const materialHash = sourceMaterial.name + '_' + sourceMaterial.smooth + '_' + hasVertexColors;
        let material = state.materials[materialHash];

        if (materialCreator) {
          material = await materialCreator.loadAsync(sourceMaterial.name);


          if (isLine && material && !(material instanceof LineBasicMaterial)) {
            const materialLine = new LineBasicMaterial();
            Material.prototype.copy.call(materialLine, material);
            materialLine.color.from(material.color);
            material = materialLine;
          } else if (isPoints && material && !(material instanceof PointsMaterial)) {
            const materialPoints = new PointsMaterial({ size: 10, sizeAttenuation: false });
            Material.prototype.copy.call(materialPoints, material);
            materialPoints.color.from(material.color);
            materialPoints.map = material.map;
            material = materialPoints;
          }
        }

        if (material === undefined) {
          if (isLine) {
            material = new LineBasicMaterial();
          } else if (isPoints) {
            material = new PointsMaterial({ size: 1, sizeAttenuation: false });
          } else {
            material = new MeshPhongMaterial();
          }

          material.name = sourceMaterial.name;
          material.flatShading = sourceMaterial.smooth ? false : true;
          material.vertexColors = hasVertexColors;

          state.materials[materialHash] = material;
        }

        createdMaterials.push(material);
      }



      let mesh;

      if (createdMaterials.length > 1) {
        for (let mi = 0, miLen = materials.length; mi < miLen; mi++) {
          const sourceMaterial = materials[mi];
          buffergeometry.addGroup(sourceMaterial.groupStart, sourceMaterial.groupCount, mi);
        }

        if (isLine) {
          mesh = new LineSegments(buffergeometry, createdMaterials);
        } else if (isPoints) {
          mesh = new Points(buffergeometry, createdMaterials);
        } else {
          mesh = new Mesh(buffergeometry, createdMaterials);
        }
      } else {
        if (isLine) {
          mesh = new LineSegments(buffergeometry, createdMaterials[0]);
        } else if (isPoints) {
          mesh = new Points(buffergeometry, createdMaterials[0]);
        } else {
          mesh = new Mesh(buffergeometry, createdMaterials[0]);
        }
      }

      mesh.name = object.name;

      container.add(mesh);
    }
  } else {


    if (state.vertices.length > 0) {
      const material = new PointsMaterial({ size: 1, sizeAttenuation: false });

      const buffergeometry = new Geometry();

      buffergeometry.setAttribute('position', new Attribute(new Float32Array(state.vertices), 3));

      if (state.colors.length > 0 && state.colors[0] !== undefined) {
        buffergeometry.setAttribute('color', new Attribute(new Float32Array(state.colors), 3));
        material.vertexColors = true;
      }

      const points = new Points(buffergeometry, material);
      container.add(points);
    }
  }

  return container;
}
