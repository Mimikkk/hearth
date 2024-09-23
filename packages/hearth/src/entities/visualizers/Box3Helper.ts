import { LineSegments } from '../LineSegments.js';
import { LineBasicMaterial } from '../materials/LineBasicMaterial.js';
import { Attribute } from '../../core/Attribute.js';
import { Geometry } from '../../core/Geometry.js';
import { Box3 } from '../../math/Box3.js';
import { ColorRepresentation } from '../../math/Color.js';

export class Box3Helper extends LineSegments {
  box: Box3;

  constructor(box: Box3, color: ColorRepresentation = 0xffff00) {
    const indices = new Uint16Array([0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7]);

    const positions = [1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1, 1, 1, -1, -1, 1, -1, -1, -1, -1, 1, -1, -1];

    const geometry = new Geometry();

    geometry.setIndex(new Attribute(indices, 1));

    geometry.setAttribute('position', new Attribute(new Float32Array(positions), 3));

    super(geometry, new LineBasicMaterial({ color: color, toneMapped: false }));

    this.box = box;

    this.geometry.calcBoundSphere();
  }

  updateMatrixWorld(force: boolean): this {
    const box = this.box;

    if (box.isEmpty()) return this;

    box.center(this.position);
    box.size(this.scale);

    this.scale.scale(0.5);
    return super.updateMatrixWorld(force);
  }
}
