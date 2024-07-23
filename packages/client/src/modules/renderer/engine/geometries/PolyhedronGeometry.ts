import { Geometry } from '../core/Geometry.js';
import { Float32BufferAttribute } from '../core/attributes/BufferAttribute.js';
import { Vec3 } from '../math/Vec3.js';
import { Vec2 } from '../math/Vec2.js';

export class PolyhedronGeometry extends Geometry {
  declare type: string | 'PolyhedronGeometry';
  declare parameters: {
    vertices: number[];
    indices: number[];
    radius: number;
    detail: number;
  };

  constructor(vertices: number[] = [], indices: number[] = [], radius: number = 1, detail: number = 0) {
    super();

    this.parameters = {
      vertices: vertices,
      indices: indices,
      radius: radius,
      detail: detail,
    };

    const vertexBuffer: number[] = [];
    const uvBuffer: number[] = [];

    // the subdivision creates the vertex buffer data

    subdivide(detail);

    // all vertices should lie on a conceptual sphere with a given radius

    applyRadius(radius);

    // finally, create the uv data

    generateUVs();

    // build non-indexed geometry

    this.setAttribute('position', new Float32BufferAttribute(vertexBuffer, 3));
    this.setAttribute('normal', new Float32BufferAttribute(vertexBuffer.slice(), 3));
    this.setAttribute('uv', new Float32BufferAttribute(uvBuffer, 2));

    if (detail === 0) {
      this.computeVertexNormals(); // flat normals
    } else {
      this.normalizeNormals(); // smooth normals
    }

    // helper functions

    function subdivide(detail: number) {
      const a = Vec3.new();
      const b = Vec3.new();
      const c = Vec3.new();

      // iterate over all faces and apply a subdivision with the given detail value

      for (let i = 0; i < indices.length; i += 3) {
        // get the vertices of the face

        getVertexByIndex(indices[i + 0], a);
        getVertexByIndex(indices[i + 1], b);
        getVertexByIndex(indices[i + 2], c);

        // perform subdivision

        subdivideFace(a, b, c, detail);
      }
    }

    function subdivideFace(a: Vec3, b: Vec3, c: Vec3, detail: number) {
      const cols = detail + 1;

      // we use this multidimensional array as a data structure for creating the subdivision

      const v: Vec3[][] = [];

      // construct all of the vertices for this subdivision

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

      // construct all of the faces

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

      // iterate over the entire buffer and apply the radius to each vertex

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
      // handle case when face straddles the seam, see #3269

      for (let i = 0; i < uvBuffer.length; i += 6) {
        // uv data of a single face

        const x0 = uvBuffer[i + 0];
        const x1 = uvBuffer[i + 2];
        const x2 = uvBuffer[i + 4];

        const max = Math.max(x0, x1, x2);
        const min = Math.min(x0, x1, x2);

        // 0.9 is somewhat arbitrary

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

    // Angle around the Y axis, counter-clockwise when looking from above.

    function azimuth(vector: Vec3) {
      return Math.atan2(vector.z, -vector.x);
    }

    // Angle above the XZ plane.

    function inclination(vector: Vec3) {
      return Math.atan2(-vector.y, Math.sqrt(vector.x * vector.x + vector.z * vector.z));
    }
  }
}

PolyhedronGeometry.prototype.type = 'PolyhedronGeometry';
