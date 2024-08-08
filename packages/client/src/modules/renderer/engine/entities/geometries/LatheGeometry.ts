import { Attribute } from '@modules/renderer/engine/core/Attribute.js';
import { Geometry } from '@modules/renderer/engine/core/Geometry.js';
import { Vec3 } from '@modules/renderer/engine/math/Vec3.js';
import { Vec2 } from '@modules/renderer/engine/math/Vec2.js';
import { clamp } from '@modules/renderer/engine/math/MathUtils.js';

export class LatheGeometry extends Geometry {
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

    phiLength = clamp(phiLength, 0, Math.PI * 2);

    const indices = [];
    const vertices = [];
    const uvs = [];
    const initNormals = [];
    const normals = [];

    const inverseSegments = 1.0 / segments;
    const vertex = Vec3.new();
    const uv = Vec2.new();
    const normal = Vec3.new();
    const curNormal = Vec3.new();
    const prevNormal = Vec3.new();
    let dx = 0;
    let dy = 0;

    for (let j = 0; j <= points.length - 1; j++) {
      switch (j) {
        case 0:
          dx = points[j + 1].x - points[j].x;
          dy = points[j + 1].y - points[j].y;

          normal.x = dy * 1.0;
          normal.y = -dx;
          normal.z = dy * 0.0;

          prevNormal.from(normal);

          normal.normalize();

          initNormals.push(normal.x, normal.y, normal.z);

          break;

        case points.length - 1:
          initNormals.push(prevNormal.x, prevNormal.y, prevNormal.z);

          break;

        default:
          dx = points[j + 1].x - points[j].x;
          dy = points[j + 1].y - points[j].y;

          normal.x = dy * 1.0;
          normal.y = -dx;
          normal.z = dy * 0.0;

          curNormal.from(normal);

          normal.x += prevNormal.x;
          normal.y += prevNormal.y;
          normal.z += prevNormal.z;

          normal.normalize();

          initNormals.push(normal.x, normal.y, normal.z);

          prevNormal.from(curNormal);
      }
    }

    for (let i = 0; i <= segments; i++) {
      const phi = phiStart + i * inverseSegments * phiLength;

      const sin = Math.sin(phi);
      const cos = Math.cos(phi);

      for (let j = 0; j <= points.length - 1; j++) {
        vertex.x = points[j].x * sin;
        vertex.y = points[j].y;
        vertex.z = points[j].x * cos;

        vertices.push(vertex.x, vertex.y, vertex.z);

        uv.x = i / segments;
        uv.y = j / (points.length - 1);

        uvs.push(uv.x, uv.y);

        const x = initNormals[3 * j + 0] * sin;
        const y = initNormals[3 * j + 1];
        const z = initNormals[3 * j + 0] * cos;

        normals.push(x, y, z);
      }
    }

    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < points.length - 1; j++) {
        const base = j + i * points.length;

        const a = base;
        const b = base + points.length;
        const c = base + points.length + 1;
        const d = base + 1;

        indices.push(a, b, d);
        indices.push(c, d, b);
      }
    }

    this.setIndex(indices);
    this.setAttribute('position', new Attribute(new Float32Array(vertices), 3));
    this.setAttribute('uv', new Attribute(new Float32Array(uvs), 2));
    this.setAttribute('normal', new Attribute(new Float32Array(normals), 3));
  }

  copy(source: this): this {
    super.copy(source);

    this.parameters = Object.assign({}, source.parameters);

    return this;
  }
}
