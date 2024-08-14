import { Geometry } from '@modules/renderer/engine/core/Geometry.js';
import { Attribute } from '@modules/renderer/engine/core/Attribute.js';
import { Vec3 } from '@modules/renderer/engine/math/Vec3.js';
import { Vec2 } from '@modules/renderer/engine/math/Vec2.js';

export class CircleGeometry extends Geometry {
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

    const indices: number[] = [];
    const vertices: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];

    const vertex = Vec3.new();
    const uv = Vec2.new();

    vertices.push(0, 0, 0);
    normals.push(0, 0, 1);
    uvs.push(0.5, 0.5);

    for (let s = 0, i = 3; s <= segments; s++, i += 3) {
      const segment = thetaStart + (s / segments) * thetaLength;

      vertex.x = radius * Math.cos(segment);
      vertex.y = radius * Math.sin(segment);

      vertices.push(vertex.x, vertex.y, vertex.z);

      normals.push(0, 0, 1);

      uv.x = (vertices[i] / radius + 1) / 2;
      uv.y = (vertices[i + 1] / radius + 1) / 2;

      uvs.push(uv.x, uv.y);
    }

    for (let i = 1; i <= segments; i++) {
      indices.push(i, i + 1, 0);
    }

    this.setIndex(indices);
    this.setAttribute('position', new Attribute(new Float32Array(vertices), 3));
    this.setAttribute('normal', new Attribute(new Float32Array(normals), 3));
    this.setAttribute('uv', new Attribute(new Float32Array(uvs), 2));
  }
}
