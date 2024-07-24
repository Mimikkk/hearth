import { Geometry } from '@modules/renderer/engine/core/Geometry.js';
import { BufferAttribute } from '@modules/renderer/engine/core/attributes/BufferAttribute.js';
import { Vec3 } from '@modules/renderer/engine/math/Vec3.js';

export class TorusKnotGeometry extends Geometry {
  declare type: string | 'TorusKnotGeometry';
  declare parameters: {
    radius: number;
    tube: number;
    tubularSegments: number;
    radialSegments: number;
    p: number;
    q: number;
  };

  constructor(
    radius: number = 1,
    tube: number = 0.4,
    tubularSegments: number = 64,
    radialSegments: number = 8,
    p: number = 2,
    q: number = 3,
  ) {
    super();

    this.type = 'TorusKnotGeometry';

    this.parameters = {
      radius: radius,
      tube: tube,
      tubularSegments: tubularSegments,
      radialSegments: radialSegments,
      p: p,
      q: q,
    };

    tubularSegments = Math.floor(tubularSegments);
    radialSegments = Math.floor(radialSegments);

    // buffers

    const indices = [];
    const vertices = [];
    const normals = [];
    const uvs = [];

    // helper variables

    const vertex = Vec3.new();
    const normal = Vec3.new();

    const P1 = Vec3.new();
    const P2 = Vec3.new();

    const B = Vec3.new();
    const T = Vec3.new();
    const N = Vec3.new();

    // generate vertices, normals and uvs

    for (let i = 0; i <= tubularSegments; ++i) {
      // the radian "u" is used to calculate the position on the torus curve of the current tubular segment

      const u = (i / tubularSegments) * p * Math.PI * 2;

      // now we calculate two points. P1 is our current position on the curve, P2 is a little farther ahead.
      // these points are used to create a special "coordinate space", which is necessary to calculate the correct vertex positions

      calculatePositionOnCurve(u, p, q, radius, P1);
      calculatePositionOnCurve(u + 0.01, p, q, radius, P2);

      // calculate orthonormal basis

      T.asSub(P2, P1);
      N.asAdd(P2, P1);
      B.asCross(T, N);
      N.asCross(B, T);

      // normalize B, N. T can be ignored, we don't use it

      B.normalize();
      N.normalize();

      for (let j = 0; j <= radialSegments; ++j) {
        // now calculate the vertices. they are nothing more than an extrusion of the torus curve.
        // because we extrude a shape in the xy-plane, there is no need to calculate a z-value.

        const v = (j / radialSegments) * Math.PI * 2;
        const cx = -tube * Math.cos(v);
        const cy = tube * Math.sin(v);

        // now calculate the final vertex position.
        // first we orient the extrusion with our basis vectors, then we add it to the current position on the curve

        vertex.x = P1.x + (cx * N.x + cy * B.x);
        vertex.y = P1.y + (cx * N.y + cy * B.y);
        vertex.z = P1.z + (cx * N.z + cy * B.z);

        vertices.push(vertex.x, vertex.y, vertex.z);

        // normal (P1 is always the center/origin of the extrusion, thus we can use it to calculate the normal)

        normal.asSub(vertex, P1).normalize();

        normals.push(normal.x, normal.y, normal.z);

        // uv

        uvs.push(i / tubularSegments);
        uvs.push(j / radialSegments);
      }
    }

    // generate indices

    for (let j = 1; j <= tubularSegments; j++) {
      for (let i = 1; i <= radialSegments; i++) {
        // indices

        const a = (radialSegments + 1) * (j - 1) + (i - 1);
        const b = (radialSegments + 1) * j + (i - 1);
        const c = (radialSegments + 1) * j + i;
        const d = (radialSegments + 1) * (j - 1) + i;

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

    // this function calculates the current position on the torus curve

    function calculatePositionOnCurve(u: number, p: number, q: number, radius: number, position: Vec3) {
      const cu = Math.cos(u);
      const su = Math.sin(u);
      const quOverP = (q / p) * u;
      const cs = Math.cos(quOverP);

      position.x = radius * (2 + cs) * 0.5 * cu;
      position.y = radius * (2 + cs) * su * 0.5;
      position.z = radius * Math.sin(quOverP) * 0.5;
    }
  }

  copy(source: this): this {
    super.copy(source);

    this.parameters = Object.assign({}, source.parameters);

    return this;
  }
}
