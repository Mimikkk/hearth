import { Geometry } from '@modules/renderer/engine/core/Geometry.js';
import { Attribute } from '@modules/renderer/engine/core/Attribute.js';
import { Vec2 } from '@modules/renderer/engine/math/Vec2.js';
import { Vec3 } from '@modules/renderer/engine/math/Vec3.js';

export class RingGeometry extends Geometry {
  declare parameters: {
    innerRadius: number;
    outerRadius: number;
    thetaSegments: number;
    phiSegments: number;
    thetaStart: number;
    thetaLength: number;
  };

  constructor(
    innerRadius: number = 0.5,
    outerRadius: number = 1,
    thetaSegments: number = 32,
    phiSegments: number = 1,
    thetaStart: number = 0,
    thetaLength: number = Math.PI * 2,
  ) {
    super();

    this.parameters = {
      innerRadius: innerRadius,
      outerRadius: outerRadius,
      thetaSegments: thetaSegments,
      phiSegments: phiSegments,
      thetaStart: thetaStart,
      thetaLength: thetaLength,
    };

    thetaSegments = Math.max(3, thetaSegments);
    phiSegments = Math.max(1, phiSegments);

    const indices = [];
    const vertices = [];
    const normals = [];
    const uvs = [];

    let radius = innerRadius;
    const radiusStep = (outerRadius - innerRadius) / phiSegments;
    const vertex = Vec3.new();
    const uv = Vec2.new();

    for (let j = 0; j <= phiSegments; j++) {
      for (let i = 0; i <= thetaSegments; i++) {
        const segment = thetaStart + (i / thetaSegments) * thetaLength;

        vertex.x = radius * Math.cos(segment);
        vertex.y = radius * Math.sin(segment);

        vertices.push(vertex.x, vertex.y, vertex.z);

        normals.push(0, 0, 1);

        uv.x = (vertex.x / outerRadius + 1) / 2;
        uv.y = (vertex.y / outerRadius + 1) / 2;

        uvs.push(uv.x, uv.y);
      }

      radius += radiusStep;
    }

    for (let j = 0; j < phiSegments; j++) {
      const thetaSegmentLevel = j * (thetaSegments + 1);

      for (let i = 0; i < thetaSegments; i++) {
        const segment = i + thetaSegmentLevel;

        const a = segment;
        const b = segment + thetaSegments + 1;
        const c = segment + thetaSegments + 2;
        const d = segment + 1;

        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    this.setIndex(indices);
    this.setAttribute('position', new Attribute(new Float32Array(vertices), 3));
    this.setAttribute('normal', new Attribute(new Float32Array(normals), 3));
    this.setAttribute('uv', new Attribute(new Float32Array(uvs), 2));
  }

  copy(source: this): this {
    super.copy(source);

    this.parameters = Object.assign({}, source.parameters);

    return this;
  }
}
