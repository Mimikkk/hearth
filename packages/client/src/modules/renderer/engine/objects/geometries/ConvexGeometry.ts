import { Geometry } from '@modules/renderer/engine/core/Geometry.js';
import { Vec3 } from '@modules/renderer/engine/math/Vec3.js';
import { ConvexHull } from '@modules/renderer/engine/math/ConvexHull.js';
import { BufferAttribute } from '@modules/renderer/engine/core/attributes/BufferAttribute.js';

export class ConvexGeometry extends Geometry {
  constructor(points: Vec3[] = []) {
    super();

    // buffers

    const vertices = [];
    const normals = [];

    const convexHull = new ConvexHull().setFromPoints(points);

    // generate vertices and normals

    const faces = convexHull.faces;

    for (let i = 0; i < faces.length; i++) {
      const face = faces[i];
      let edge = face.edge!;

      // we move along a doubly-connected edge list to access all face points (see HalfEdge docs)

      do {
        const point = edge.head().point;

        vertices.push(point.x, point.y, point.z);
        normals.push(face.normal.x, face.normal.y, face.normal.z);

        edge = edge.next!;
      } while (edge !== face.edge);
    }

    // build geometry

    this.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));
    this.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3));
  }
}
