import { BufferGeometry } from '../core/BufferGeometry.js';
import { Float32BufferAttribute } from '../core/BufferAttribute.js';
import { Vec3 } from '../math/Vec3.js';
import { Vec2 } from '../math/Vec2.js';

export class CircleGeometry extends BufferGeometry {
  declare type: string | 'CircleGeometry';
  declare parameters: {
    radius: number;
    segments: number;
    thetaStart: number;
    thetaLength: number;
  };

  constructor(radius = 1, segments = 32, thetaStart = 0, thetaLength = Math.PI * 2) {
    super();
    this.parameters = { radius, segments, thetaStart, thetaLength };
    segments = Math.max(3, segments);

    // buffers

    const indices: number[] = [];
    const vertices: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];

    // helper variables

    const vertex = new Vec3();
    const uv = Vec2.new();

    // center point

    vertices.push(0, 0, 0);
    normals.push(0, 0, 1);
    uvs.push(0.5, 0.5);

    for (let s = 0, i = 3; s <= segments; s++, i += 3) {
      const segment = thetaStart + (s / segments) * thetaLength;

      // vertex

      vertex.x = radius * Math.cos(segment);
      vertex.y = radius * Math.sin(segment);

      vertices.push(vertex.x, vertex.y, vertex.z);

      // normal

      normals.push(0, 0, 1);

      // uvs

      uv.x = (vertices[i] / radius + 1) / 2;
      uv.y = (vertices[i + 1] / radius + 1) / 2;

      uvs.push(uv.x, uv.y);
    }

    // indices

    for (let i = 1; i <= segments; i++) {
      indices.push(i, i + 1, 0);
    }

    // build geometry

    this.setIndex(indices);
    this.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    this.setAttribute('normal', new Float32BufferAttribute(normals, 3));
    this.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  }

  copy(source: this): this {
    super.copy(source);

    this.parameters = Object.assign({}, source.parameters);

    return this;
  }
}

CircleGeometry.prototype.type = 'CircleGeometry';
