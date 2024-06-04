import {
  BufferAttribute,
  BufferGeometry,
  Color,
  RFileLoader,
  Float32BufferAttribute,
  Loader,
  Vector3,
} from '../../threejs/Three.js';

export class STLLoader<TUrl extends string = string> extends Loader {
  responseType: 'text' = 'text';

  constructor(options?: STLLoader.Options) {
    super(options);
  }

  load(url: TUrl, handlers?: Loader.Handlers<BufferGeometry>) {
    const scope = this;

    RFileLoader.load(url, this, {
      onLoad: this.createOnLoad(url, handlers?.onLoad, handlers?.onError),
      onProgress: handlers?.onProgress,
      onError: handlers?.onError,
    });
  }

  createOnLoad(
    url: string,
    onLoad: undefined | Loader.OnLoad<BufferGeometry>,
    onError: Loader.OnError = console.error,
  ) {
    return (text: string) => {
      try {
        onLoad?.(this.parse(text));
      } catch (e) {
        onError?.(e);

        this.manager.itemError(url);
      }
    };
  }

  parse(data: string) {
    function isBinary(data) {
      const reader = new DataView(data);
      const face_size = (32 / 8) * 3 + (32 / 8) * 3 * 3 + 16 / 8;
      const n_faces = reader.getUint32(80, true);
      const expect = 80 + 32 / 8 + n_faces * face_size;

      if (expect === reader.byteLength) {
        return true;
      }

      // An ASCII STL data must begin with 'solid ' as the first six bytes.
      // However, ASCII STLs lacking the SPACE after the 'd' are known to be
      // plentiful.  So, check the first 5 bytes for 'solid'.

      // Several encodings, such as UTF-8, precede the text with up to 5 bytes:
      // https://en.wikipedia.org/wiki/Byte_order_mark#Byte_order_marks_by_encoding
      // Search for "solid" to start anywhere after those prefixes.

      // US-ASCII ordinal values for 's', 'o', 'l', 'i', 'd'

      const solid = [115, 111, 108, 105, 100];

      for (let off = 0; off < 5; off++) {
        // If "solid" text is matched to the current offset, declare it to be an ASCII STL.

        if (matchDataViewAt(solid, reader, off)) return false;
      }

      // Couldn't find "solid" text at the beginning; it is binary STL.

      return true;
    }

    function matchDataViewAt(query, reader, offset) {
      // Check if each byte in query matches the corresponding byte from the current offset

      for (let i = 0, il = query.length; i < il; i++) {
        if (query[i] !== reader.getUint8(offset + i)) return false;
      }

      return true;
    }

    function parseBinary(data) {
      const reader = new DataView(data);
      const faces = reader.getUint32(80, true);

      let r,
        g,
        b,
        hasColors = false,
        colors;
      let defaultR, defaultG, defaultB, alpha;

      // process STL header
      // check for default color in header ("COLOR=rgba" sequence).

      for (let index = 0; index < 80 - 10; index++) {
        if (
          reader.getUint32(index, false) == 0x434f4c4f /*COLO*/ &&
          reader.getUint8(index + 4) == 0x52 /*'R'*/ &&
          reader.getUint8(index + 5) == 0x3d /*'='*/
        ) {
          hasColors = true;
          colors = new Float32Array(faces * 3 * 3);

          defaultR = reader.getUint8(index + 6) / 255;
          defaultG = reader.getUint8(index + 7) / 255;
          defaultB = reader.getUint8(index + 8) / 255;
          alpha = reader.getUint8(index + 9) / 255;
        }
      }

      const dataOffset = 84;
      const faceLength = 12 * 4 + 2;

      const geometry = new BufferGeometry();

      const vertices = new Float32Array(faces * 3 * 3);
      const normals = new Float32Array(faces * 3 * 3);

      const color = new Color();

      for (let face = 0; face < faces; face++) {
        const start = dataOffset + face * faceLength;
        const normalX = reader.getFloat32(start, true);
        const normalY = reader.getFloat32(start + 4, true);
        const normalZ = reader.getFloat32(start + 8, true);

        if (hasColors) {
          const packedColor = reader.getUint16(start + 48, true);

          if ((packedColor & 0x8000) === 0) {
            // facet has its own unique color

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

          if (hasColors) {
            color.set(r, g, b).convertSRGBToLinear();

            colors[componentIdx] = color.r;
            colors[componentIdx + 1] = color.g;
            colors[componentIdx + 2] = color.b;
          }
        }
      }

      geometry.setAttribute('position', new BufferAttribute(vertices, 3));
      geometry.setAttribute('normal', new BufferAttribute(normals, 3));

      if (hasColors) {
        geometry.setAttribute('color', new BufferAttribute(colors, 3));
        geometry.hasColors = true;
        geometry.alpha = alpha;
      }

      return geometry;
    }

    function parseASCII(data) {
      const geometry = new BufferGeometry();
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

      const normal = new Vector3();

      let result;

      let groupCount = 0;
      let startVertex = 0;
      let endVertex = 0;

      while ((result = patternSolid.exec(data)) !== null) {
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

          // every face have to own ONE valid normal

          if (normalCountPerFace !== 1) {
            console.error("THREE.STLLoader: Something isn't right with the normal of face number " + faceCounter);
          }

          // each face have to own THREE valid vertices

          if (vertexCountPerFace !== 3) {
            console.error("THREE.STLLoader: Something isn't right with the vertices of face number " + faceCounter);
          }

          faceCounter++;
        }

        const start = startVertex;
        const count = endVertex - startVertex;

        geometry.userData.groupNames = groupNames;

        geometry.addGroup(start, count, groupCount);
        groupCount++;
      }

      geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
      geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3));

      return geometry;
    }

    function ensureString(buffer) {
      if (typeof buffer !== 'string') {
        return new TextDecoder().decode(buffer);
      }

      return buffer;
    }

    function ensureBinary(buffer) {
      if (typeof buffer === 'string') {
        const array_buffer = new Uint8Array(buffer.length);
        for (let i = 0; i < buffer.length; i++) {
          array_buffer[i] = buffer.charCodeAt(i) & 0xff; // implicitly assumes little-endian
        }

        return array_buffer.buffer || array_buffer;
      } else {
        return buffer;
      }
    }

    // start

    const binData = ensureBinary(data);

    return isBinary(binData) ? parseBinary(binData) : parseASCII(ensureString(data));
  }
}

export namespace STLLoader {
  export interface Options extends Pick<Loader.Options, 'manager' | 'path' | 'requestHeader' | 'withCredentials'> {}
}
