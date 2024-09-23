import { Geometry } from '../../core/Geometry.js';
import { Vec3 } from '../../math/Vec3.js';
import { Attribute } from '../../core/Attribute.js';

export class ParametricGeometry extends Geometry {
  declare parameters: {
    func: (u: number, v: number, target: Vec3) => void;
    slices: number;
    stacks: number;
  };

  constructor(parameters: ParametricGeometryParameters) {
    super();
    const { fn, slices, stacks } = configure(parameters);

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

    const sliceCount = slices + 1;

    for (let i = 0; i <= stacks; i++) {
      const v = i / stacks;

      for (let j = 0; j <= slices; j++) {
        const u = j / slices;

        fn(u, v, p0);
        vertices.push(p0.x, p0.y, p0.z);

        if (u - EPS >= 0) {
          fn(u - EPS, v, p1);
          pu.asSub(p0, p1);
        } else {
          fn(u + EPS, v, p1);
          pu.asSub(p1, p0);
        }

        if (v - EPS >= 0) {
          fn(u, v - EPS, p1);
          pv.asSub(p0, p1);
        } else {
          fn(u, v + EPS, p1);
          pv.asSub(p1, p0);
        }

        normal.asCross(pu, pv).normalize();
        normals.push(normal.x, normal.y, normal.z);

        uvs.push(u, v);
      }
    }

    for (let i = 0; i < stacks; i++) {
      for (let j = 0; j < slices; j++) {
        const a = i * sliceCount + j;
        const b = i * sliceCount + j + 1;
        const c = (i + 1) * sliceCount + j + 1;
        const d = (i + 1) * sliceCount + j;

        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    this.setIndex(indices);
    this.setAttribute('position', new Attribute(new Float32Array(vertices), 3));
    this.setAttribute('normal', new Attribute(new Float32Array(normals), 3));
    this.setAttribute('uv', new Attribute(new Float32Array(uvs), 2));
  }
}

export interface ParametricGeometryParameters {
  fn: (u: number, v: number, into: Vec3) => void;
  slices?: number;
  stacks?: number;
}

export interface ParametricGeometryConfiguration {
  fn: (u: number, v: number, into: Vec3) => void;
  slices: number;
  stacks: number;
}

const configure = (parameters: ParametricGeometryParameters): ParametricGeometryConfiguration => ({
  fn: parameters.fn,
  slices: parameters?.slices ?? 8,
  stacks: parameters?.stacks ?? 8,
});
