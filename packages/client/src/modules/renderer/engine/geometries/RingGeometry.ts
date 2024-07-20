import { BufferGeometry } from '../core/BufferGeometry.js';
import { Float32BufferAttribute } from '../core/BufferAttribute.js';
import { Vec2 } from '../math/Vec2.js';
import { Vec3 } from '../math/Vec3.js';

export class RingGeometry extends BufferGeometry {
  declare type: string | 'RingGeometry';
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

    // buffers

    const indices = [];
    const vertices = [];
    const normals = [];
    const uvs = [];

    // some helper variables

    let radius = innerRadius;
    const radiusStep = (outerRadius - innerRadius) / phiSegments;
    const vertex = new Vec3();
    const uv = new Vec2();

    // generate vertices, normals and uvs

    for (let j = 0; j <= phiSegments; j++) {
      for (let i = 0; i <= thetaSegments; i++) {
        // values are generate from the inside of the ring to the outside

        const segment = thetaStart + (i / thetaSegments) * thetaLength;

        // vertex

        vertex.x = radius * Math.cos(segment);
        vertex.y = radius * Math.sin(segment);

        vertices.push(vertex.x, vertex.y, vertex.z);

        // normal

        normals.push(0, 0, 1);

        // uv

        uv.x = (vertex.x / outerRadius + 1) / 2;
        uv.y = (vertex.y / outerRadius + 1) / 2;

        uvs.push(uv.x, uv.y);
      }

      // increase the radius for next row of vertices

      radius += radiusStep;
    }

    // indices

    for (let j = 0; j < phiSegments; j++) {
      const thetaSegmentLevel = j * (thetaSegments + 1);

      for (let i = 0; i < thetaSegments; i++) {
        const segment = i + thetaSegmentLevel;

        const a = segment;
        const b = segment + thetaSegments + 1;
        const c = segment + thetaSegments + 2;
        const d = segment + 1;

        // faces

        indices.push(a, b, d);
        indices.push(b, c, d);
      }
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

RingGeometry.prototype.type = 'RingGeometry';
