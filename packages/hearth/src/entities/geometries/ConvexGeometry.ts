import { Geometry } from '../../core/Geometry.js';
import { Vec3 } from '../../math/Vec3.js';
import { ConvexHull } from '../../math/ConvexHull.js';
import { Attribute } from '../../core/Attribute.js';

export class ConvexGeometry extends Geometry {
  constructor(points: Vec3[] = []) {
    super();

    const vertices = [];
    const normals = [];
    const convexHull = new ConvexHull().setFromPoints(points);

    const faces = convexHull.faces;

    for (let i = 0; i < faces.length; i++) {
      const face = faces[i];
      let edge = face.edge!;

      do {
        const point = edge.head().point;

        vertices.push(point.x, point.y, point.z);
        normals.push(face.normal.x, face.normal.y, face.normal.z);

        edge = edge.next!;
      } while (edge !== face.edge);
    }

    this.setAttribute('position', new Attribute(new Float32Array(vertices), 3));
    this.setAttribute('normal', new Attribute(new Float32Array(normals), 3));
  }
}
