import { Float32BufferAttribute } from '../core/BufferAttribute.js';
import { BufferGeometry } from '../core/BufferGeometry.js';
import { Vector3 } from '../math/Vector3.js';
import { Vec2 } from '../math/Vector2.js';
import * as MathUtils from '../math/MathUtils.js';

export class LatheGeometry extends BufferGeometry {
  declare type: string | 'LatheGeometry';
  declare parameters: {
    points: Vec2[];
    segments: number;
    phiStart: number;
    phiLength: number;
  };

  constructor(
    points: Vec2[] = [Vec2.new(0, -0.5), Vec2.new(0.5, 0), Vec2.new(0, 0.5)],
    segments: number = 12,
    phiStart: number = 0,
    phiLength: number = Math.PI * 2,
  ) {
    super();

    this.parameters = {
      points: points,
      segments: segments,
      phiStart: phiStart,
      phiLength: phiLength,
    };

    segments = Math.floor(segments);

    // clamp phiLength so it's in range of [ 0, 2PI ]

    phiLength = MathUtils.clamp(phiLength, 0, Math.PI * 2);

    // buffers

    const indices = [];
    const vertices = [];
    const uvs = [];
    const initNormals = [];
    const normals = [];

    // helper variables

    const inverseSegments = 1.0 / segments;
    const vertex = new Vector3();
    const uv = Vec2.new();
    const normal = new Vector3();
    const curNormal = new Vector3();
    const prevNormal = new Vector3();
    let dx = 0;
    let dy = 0;

    // pre-compute normals for initial "meridian"

    for (let j = 0; j <= points.length - 1; j++) {
      switch (j) {
        case 0: // special handling for 1st vertex on path
          dx = points[j + 1].x - points[j].x;
          dy = points[j + 1].y - points[j].y;

          normal.x = dy * 1.0;
          normal.y = -dx;
          normal.z = dy * 0.0;

          prevNormal.copy(normal);

          normal.normalize();

          initNormals.push(normal.x, normal.y, normal.z);

          break;

        case points.length - 1: // special handling for last Vertex on path
          initNormals.push(prevNormal.x, prevNormal.y, prevNormal.z);

          break;

        default: // default handling for all vertices in between
          dx = points[j + 1].x - points[j].x;
          dy = points[j + 1].y - points[j].y;

          normal.x = dy * 1.0;
          normal.y = -dx;
          normal.z = dy * 0.0;

          curNormal.copy(normal);

          normal.x += prevNormal.x;
          normal.y += prevNormal.y;
          normal.z += prevNormal.z;

          normal.normalize();

          initNormals.push(normal.x, normal.y, normal.z);

          prevNormal.copy(curNormal);
      }
    }

    // generate vertices, uvs and normals

    for (let i = 0; i <= segments; i++) {
      const phi = phiStart + i * inverseSegments * phiLength;

      const sin = Math.sin(phi);
      const cos = Math.cos(phi);

      for (let j = 0; j <= points.length - 1; j++) {
        // vertex

        vertex.x = points[j].x * sin;
        vertex.y = points[j].y;
        vertex.z = points[j].x * cos;

        vertices.push(vertex.x, vertex.y, vertex.z);

        // uv

        uv.x = i / segments;
        uv.y = j / (points.length - 1);

        uvs.push(uv.x, uv.y);

        // normal

        const x = initNormals[3 * j + 0] * sin;
        const y = initNormals[3 * j + 1];
        const z = initNormals[3 * j + 0] * cos;

        normals.push(x, y, z);
      }
    }

    // indices

    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < points.length - 1; j++) {
        const base = j + i * points.length;

        const a = base;
        const b = base + points.length;
        const c = base + points.length + 1;
        const d = base + 1;

        // faces

        indices.push(a, b, d);
        indices.push(c, d, b);
      }
    }

    // build geometry

    this.setIndex(indices);
    this.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    this.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
    this.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  }

  copy(source: this): this {
    super.copy(source);

    this.parameters = Object.assign({}, source.parameters);

    return this;
  }
}

LatheGeometry.prototype.type = 'LatheGeometry';
