import { Geometry } from '@modules/renderer/engine/core/Geometry.js';
import { Attribute } from '@modules/renderer/engine/core/Attribute.js';
import { Vec3 } from '@modules/renderer/engine/math/Vec3.js';
import { Vec2 } from '@modules/renderer/engine/math/Vec2.js';

export class PolyhedronGeometry extends Geometry {
  constructor(parameters: PolyhedronGeometryParameters) {
    super();
    const { vertices, indices, radius, detail } = configure(parameters);

    const vertexBuffer: number[] = [];
    const uvBuffer: number[] = [];

    subdivide(detail);

    applyRadius(radius);

    generateUVs();

    this.setAttribute('position', new Attribute(new Float32Array(vertexBuffer), 3));
    this.setAttribute('normal', new Attribute(new Float32Array(vertexBuffer.slice()), 3));
    this.setAttribute('uv', new Attribute(new Float32Array(uvBuffer), 2));

    if (detail === 0) {
      this.computeVertexNormals();
    } else {
      this.normalizeNormals();
    }

    function subdivide(detail: number) {
      const a = Vec3.new();
      const b = Vec3.new();
      const c = Vec3.new();

      for (let i = 0; i < indices.length; i += 3) {
        getVertexByIndex(indices[i + 0], a);
        getVertexByIndex(indices[i + 1], b);
        getVertexByIndex(indices[i + 2], c);

        subdivideFace(a, b, c, detail);
      }
    }

    function subdivideFace(a: Vec3, b: Vec3, c: Vec3, detail: number) {
      const cols = detail + 1;

      const v: Vec3[][] = [];

      for (let i = 0; i <= cols; i++) {
        v[i] = [];

        const aj = a.clone().lerp(c, i / cols);
        const bj = b.clone().lerp(c, i / cols);

        const rows = cols - i;

        for (let j = 0; j <= rows; j++) {
          if (j === 0 && i === cols) {
            v[i][j] = aj;
          } else {
            v[i][j] = aj.clone().lerp(bj, j / rows);
          }
        }
      }

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < 2 * (cols - i) - 1; j++) {
          const k = Math.floor(j / 2);

          if (j % 2 === 0) {
            pushVertex(v[i][k + 1]);
            pushVertex(v[i + 1][k]);
            pushVertex(v[i][k]);
          } else {
            pushVertex(v[i][k + 1]);
            pushVertex(v[i + 1][k + 1]);
            pushVertex(v[i + 1][k]);
          }
        }
      }
    }

    function applyRadius(radius: number) {
      const vertex = Vec3.new();

      for (let i = 0; i < vertexBuffer.length; i += 3) {
        vertex.x = vertexBuffer[i + 0];
        vertex.y = vertexBuffer[i + 1];
        vertex.z = vertexBuffer[i + 2];

        vertex.normalize().scale(radius);

        vertexBuffer[i + 0] = vertex.x;
        vertexBuffer[i + 1] = vertex.y;
        vertexBuffer[i + 2] = vertex.z;
      }
    }

    function generateUVs() {
      const vertex = Vec3.new();

      for (let i = 0; i < vertexBuffer.length; i += 3) {
        vertex.x = vertexBuffer[i + 0];
        vertex.y = vertexBuffer[i + 1];
        vertex.z = vertexBuffer[i + 2];

        const u = azimuth(vertex) / 2 / Math.PI + 0.5;
        const v = inclination(vertex) / Math.PI + 0.5;
        uvBuffer.push(u, 1 - v);
      }

      correctUVs();

      correctSeam();
    }

    function correctSeam() {
      for (let i = 0; i < uvBuffer.length; i += 6) {
        const x0 = uvBuffer[i + 0];
        const x1 = uvBuffer[i + 2];
        const x2 = uvBuffer[i + 4];

        const max = Math.max(x0, x1, x2);
        const min = Math.min(x0, x1, x2);

        if (max > 0.9 && min < 0.1) {
          if (x0 < 0.2) uvBuffer[i + 0] += 1;
          if (x1 < 0.2) uvBuffer[i + 2] += 1;
          if (x2 < 0.2) uvBuffer[i + 4] += 1;
        }
      }
    }

    function pushVertex(vertex: Vec3) {
      vertexBuffer.push(vertex.x, vertex.y, vertex.z);
    }

    function getVertexByIndex(index: number, vertex: Vec3) {
      const stride = index * 3;

      vertex.x = vertices[stride + 0];
      vertex.y = vertices[stride + 1];
      vertex.z = vertices[stride + 2];
    }

    function correctUVs() {
      const a = Vec3.new();
      const b = Vec3.new();
      const c = Vec3.new();

      const centroid = Vec3.new();

      const uvA = Vec2.new();
      const uvB = Vec2.new();
      const uvC = Vec2.new();

      for (let i = 0, j = 0; i < vertexBuffer.length; i += 9, j += 6) {
        a.set(vertexBuffer[i + 0], vertexBuffer[i + 1], vertexBuffer[i + 2]);
        b.set(vertexBuffer[i + 3], vertexBuffer[i + 4], vertexBuffer[i + 5]);
        c.set(vertexBuffer[i + 6], vertexBuffer[i + 7], vertexBuffer[i + 8]);

        uvA.set(uvBuffer[j + 0], uvBuffer[j + 1]);
        uvB.set(uvBuffer[j + 2], uvBuffer[j + 3]);
        uvC.set(uvBuffer[j + 4], uvBuffer[j + 5]);

        centroid.from(a).add(b).add(c).divScalar(3);

        const azi = azimuth(centroid);

        correctUV(uvA, j + 0, a, azi);
        correctUV(uvB, j + 2, b, azi);
        correctUV(uvC, j + 4, c, azi);
      }
    }

    function correctUV(uv: Vec2, stride: number, vector: Vec3, azimuth: number) {
      if (azimuth < 0 && uv.x === 1) {
        uvBuffer[stride] = uv.x - 1;
      }

      if (vector.x === 0 && vector.z === 0) {
        uvBuffer[stride] = azimuth / 2 / Math.PI + 0.5;
      }
    }

    function azimuth(vector: Vec3) {
      return Math.atan2(vector.z, -vector.x);
    }

    function inclination(vector: Vec3) {
      return Math.atan2(-vector.y, Math.sqrt(vector.x * vector.x + vector.z * vector.z));
    }
  }
}

export interface PolyhedronGeometryParameters {
  vertices?: number[];
  indices?: number[];
  radius?: number;
  detail?: number;
}

export interface PolyhedronGeometryConfiguration {
  vertices: number[];
  indices: number[];
  radius: number;
  detail: number;
}

const configure = (parameters?: PolyhedronGeometryParameters): PolyhedronGeometryConfiguration => ({
  vertices: parameters?.vertices ?? [],
  indices: parameters?.indices ?? [],
  radius: parameters?.radius ?? 1,
  detail: parameters?.detail ?? 0,
});
