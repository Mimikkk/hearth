import { LineSegments2 } from './LineSegments2.js';
import { LineGeometry } from './LineGeometry.js';
import { LineMaterial } from './LineMaterial.js';

export class Line2 extends LineSegments2 {
  constructor(
    geometry: LineGeometry = new LineGeometry(),
    material: LineMaterial = new LineMaterial({ color: Math.random() * 0xffffff }),
  ) {
    super(geometry, material);
  }
}
