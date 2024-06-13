import { Mesh } from '../engine.js';
import { LineSegmentsGeometry } from './LineSegmentsGeometry.js';
import { LineMaterial } from './LineMaterial.js';

export class Wireframe extends Mesh {
  constructor(
    geometry: LineSegmentsGeometry = new LineSegmentsGeometry(),
    material: LineMaterial = new LineMaterial({ color: Math.random() * 0xffffff }),
  ) {
    super(geometry, material);
  }
}
