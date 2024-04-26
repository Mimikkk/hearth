import { Mesh } from '../Three.js';
import { LineSegmentsGeometry } from './LineSegmentsGeometry.js';
import { LineMaterial } from './LineMaterial.js';

export class Wireframe extends Mesh {
  declare isWireframe: true;
  declare type: string | 'Wireframe';

  constructor(
    geometry: LineSegmentsGeometry = new LineSegmentsGeometry(),
    material: LineMaterial = new LineMaterial({ color: Math.random() * 0xffffff }),
  ) {
    super(geometry, material);
  }
}
Wireframe.prototype.isWireframe = true;
Wireframe.prototype.type = 'Wireframe';
