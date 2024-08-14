import { Geometry } from '@modules/renderer/engine/core/Geometry.js';
import { Attribute } from '@modules/renderer/engine/core/Attribute.js';
import { QuadraticBezierCurve3 } from '@modules/renderer/engine/math/curves/curves/Curves.js';
import { Vec2 } from '@modules/renderer/engine/math/Vec2.js';
import { Vec3 } from '@modules/renderer/engine/math/Vec3.js';
import { Curve } from '@modules/renderer/engine/math/curves/Curve.js';

export class TubeGeometry extends Geometry {
  constructor(parameters?: TubeGeometryParameters) {
    super();

    let { path, tubularSegments, radius, radialSegments, closed } = configure(parameters);
    const frames = path.computeFrenetFrames(tubularSegments, closed);

    const vertex = Vec3.new();
    const normal = Vec3.new();
    const uv = Vec2.new();
    let P = Vec3.new();

    const vertices: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    generateBufferData();

    this.setIndex(indices);
    this.setAttribute('position', new Attribute(new Float32Array(vertices), 3));
    this.setAttribute('normal', new Attribute(new Float32Array(normals), 3));
    this.setAttribute('uv', new Attribute(new Float32Array(uvs), 2));

    function generateBufferData() {
      for (let i = 0; i < tubularSegments; i++) {
        generateSegment(i);
      }

      generateSegment(closed === false ? tubularSegments : 0);

      generateUVs();

      generateIndices();
    }

    function generateSegment(i: number) {
      P = path.getPointAt(i / tubularSegments, P);

      const N = frames.normals[i];
      const B = frames.binormals[i];

      for (let j = 0; j <= radialSegments; j++) {
        const v = (j / radialSegments) * Math.PI * 2;

        const sin = Math.sin(v);
        const cos = -Math.cos(v);

        normal.x = cos * N.x + sin * B.x;
        normal.y = cos * N.y + sin * B.y;
        normal.z = cos * N.z + sin * B.z;
        normal.normalize();

        normals.push(normal.x, normal.y, normal.z);

        vertex.x = P.x + radius * normal.x;
        vertex.y = P.y + radius * normal.y;
        vertex.z = P.z + radius * normal.z;

        vertices.push(vertex.x, vertex.y, vertex.z);
      }
    }

    function generateIndices() {
      for (let j = 1; j <= tubularSegments; j++) {
        for (let i = 1; i <= radialSegments; i++) {
          const a = (radialSegments + 1) * (j - 1) + (i - 1);
          const b = (radialSegments + 1) * j + (i - 1);
          const c = (radialSegments + 1) * j + i;
          const d = (radialSegments + 1) * (j - 1) + i;

          indices.push(a, b, d);
          indices.push(b, c, d);
        }
      }
    }

    function generateUVs() {
      for (let i = 0; i <= tubularSegments; i++) {
        for (let j = 0; j <= radialSegments; j++) {
          uv.x = i / tubularSegments;
          uv.y = j / radialSegments;

          uvs.push(uv.x, uv.y);
        }
      }
    }
  }
}

export interface TubeGeometryParameters {
  path?: Curve<Vec3>;
  tubularSegments?: number;
  radius?: number;
  radialSegments?: number;
  closed?: boolean;
}

export interface TubeGeometryConfiguration {
  path: Curve<Vec3>;
  tubularSegments: number;
  radius: number;
  radialSegments: number;
  closed: boolean;
}

const configure = (parameters?: TubeGeometryParameters): TubeGeometryConfiguration => ({
  path: parameters?.path ?? new QuadraticBezierCurve3(Vec3.new(-1, -1, 0), Vec3.new(-1, 1, 0), Vec3.new(1, 1, 0)),
  tubularSegments: parameters?.tubularSegments ?? 64,
  radius: parameters?.radius ?? 0.1,
  radialSegments: parameters?.radialSegments ?? 8,
  closed: parameters?.closed ?? false,
});
