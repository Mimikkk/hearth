import { Geometry } from '@modules/renderer/engine/core/Geometry.js';
import { Attribute } from '@modules/renderer/engine/core/Attribute.js';
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



    const indices = [];
    const vertices = [];
    const normals = [];
    const uvs = [];



    const vertex = Vec3.new();
    const normal = Vec3.new();

    const P1 = Vec3.new();
    const P2 = Vec3.new();

    const B = Vec3.new();
    const T = Vec3.new();
    const N = Vec3.new();



    for (let i = 0; i <= tubularSegments; ++i) {


      const u = (i / tubularSegments) * p * Math.PI * 2;




      calculatePositionOnCurve(u, p, q, radius, P1);
      calculatePositionOnCurve(u + 0.01, p, q, radius, P2);



      T.asSub(P2, P1);
      N.asAdd(P2, P1);
      B.asCross(T, N);
      N.asCross(B, T);



      B.normalize();
      N.normalize();

      for (let j = 0; j <= radialSegments; ++j) {



        const v = (j / radialSegments) * Math.PI * 2;
        const cx = -tube * Math.cos(v);
        const cy = tube * Math.sin(v);




        vertex.x = P1.x + (cx * N.x + cy * B.x);
        vertex.y = P1.y + (cx * N.y + cy * B.y);
        vertex.z = P1.z + (cx * N.z + cy * B.z);

        vertices.push(vertex.x, vertex.y, vertex.z);



        normal.asSub(vertex, P1).normalize();

        normals.push(normal.x, normal.y, normal.z);



        uvs.push(i / tubularSegments);
        uvs.push(j / radialSegments);
      }
    }



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



    this.setIndex(indices);
    this.setAttribute('position', new Attribute(new Float32Array(vertices), 3));
    this.setAttribute('normal', new Attribute(new Float32Array(normals), 3));
    this.setAttribute('uv', new Attribute(new Float32Array(uvs), 2));



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
