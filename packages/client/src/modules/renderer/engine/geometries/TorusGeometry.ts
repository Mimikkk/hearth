import { Geometry } from '../core/Geometry.js';
import { BufferAttribute } from '../core/attributes/BufferAttribute.js';
import { Vec3 } from '../math/Vec3.js';

export class TorusGeometry extends Geometry {
  declare type: string | 'TorusGeometry';
  declare parameters: {
    radius: number;
    tube: number;
    radialSegments: number;
    tubularSegments: number;
    arc: number;
  };

  constructor(radius = 1, tube = 0.4, radialSegments = 12, tubularSegments = 48, arc = Math.PI * 2) {
    super();

    this.type = 'TorusGeometry';
    this.parameters = {
      radius: radius,
      tube: tube,
      radialSegments: radialSegments,
      tubularSegments: tubularSegments,
      arc: arc,
    };

    radialSegments = Math.floor(radialSegments);
    tubularSegments = Math.floor(tubularSegments);

    // buffers

    const indices = [];
    const vertices = [];
    const normals = [];
    const uvs = [];

    // helper variables

    const center = Vec3.new();
    const vertex = Vec3.new();
    const normal = Vec3.new();

    // generate vertices, normals and uvs

    for (let j = 0; j <= radialSegments; j++) {
      for (let i = 0; i <= tubularSegments; i++) {
        const u = (i / tubularSegments) * arc;
        const v = (j / radialSegments) * Math.PI * 2;

        // vertex

        vertex.x = (radius + tube * Math.cos(v)) * Math.cos(u);
        vertex.y = (radius + tube * Math.cos(v)) * Math.sin(u);
        vertex.z = tube * Math.sin(v);

        vertices.push(vertex.x, vertex.y, vertex.z);

        // normal

        center.x = radius * Math.cos(u);
        center.y = radius * Math.sin(u);
        normal.asSub(vertex, center).normalize();

        normals.push(normal.x, normal.y, normal.z);

        // uv

        uvs.push(i / tubularSegments);
        uvs.push(j / radialSegments);
      }
    }

    // generate indices

    for (let j = 1; j <= radialSegments; j++) {
      for (let i = 1; i <= tubularSegments; i++) {
        // indices

        const a = (tubularSegments + 1) * j + i - 1;
        const b = (tubularSegments + 1) * (j - 1) + i - 1;
        const c = (tubularSegments + 1) * (j - 1) + i;
        const d = (tubularSegments + 1) * j + i;

        // faces

        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    // build geometry

    this.setIndex(indices);
    this.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));
    this.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3));
    this.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2));
  }

  copy(source: this): this {
    super.copy(source);

    this.parameters = Object.assign({}, source.parameters);

    return this;
  }
}

TorusGeometry.prototype.type = 'TorusGeometry';
