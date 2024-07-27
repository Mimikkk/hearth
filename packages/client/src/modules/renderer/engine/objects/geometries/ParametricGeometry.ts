import { Geometry } from '@modules/renderer/engine/core/Geometry.js';
import { Vec3 } from '@modules/renderer/engine/math/Vec3.js';
import { BufferAttribute } from '@modules/renderer/engine/core/BufferAttribute.js';

export class ParametricGeometry extends Geometry {
  declare type: string | 'ParametricGeometry';
  declare parameters: {
    func: (u: number, v: number, target: Vec3) => void;
    slices: number;
    stacks: number;
  };

  constructor(
    func = (u: number, v: number, target: Vec3): void => {
      target.set(u, v, Math.cos(u) * Math.sin(v));
    },
    slices = 8,
    stacks = 8,
  ) {
    super();

    this.type = 'ParametricGeometry';

    this.parameters = {
      func: func,
      slices: slices,
      stacks: stacks,
    };

    // buffers

    const indices = [];
    const vertices = [];
    const normals = [];
    const uvs = [];

    const EPS = 0.00001;

    const normal = Vec3.new();

    const p0 = Vec3.new(),
      p1 = Vec3.new();
    const pu = Vec3.new(),
      pv = Vec3.new();

    // generate vertices, normals and uvs

    const sliceCount = slices + 1;

    for (let i = 0; i <= stacks; i++) {
      const v = i / stacks;

      for (let j = 0; j <= slices; j++) {
        const u = j / slices;

        // vertex

        func(u, v, p0);
        vertices.push(p0.x, p0.y, p0.z);

        // normal

        // approximate tangent vectors via finite differences

        if (u - EPS >= 0) {
          func(u - EPS, v, p1);
          pu.asSub(p0, p1);
        } else {
          func(u + EPS, v, p1);
          pu.asSub(p1, p0);
        }

        if (v - EPS >= 0) {
          func(u, v - EPS, p1);
          pv.asSub(p0, p1);
        } else {
          func(u, v + EPS, p1);
          pv.asSub(p1, p0);
        }

        // cross product of tangent vectors returns surface normal

        normal.asCross(pu, pv).normalize();
        normals.push(normal.x, normal.y, normal.z);

        // uv

        uvs.push(u, v);
      }
    }

    // generate indices

    for (let i = 0; i < stacks; i++) {
      for (let j = 0; j < slices; j++) {
        const a = i * sliceCount + j;
        const b = i * sliceCount + j + 1;
        const c = (i + 1) * sliceCount + j + 1;
        const d = (i + 1) * sliceCount + j;

        // faces one and two

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
