import { LineSegments } from '../objects/LineSegments.js';
import { LineBasicMaterial } from '../materials/LineBasicMaterial.js';
import { BufferAttribute, Float32BufferAttribute } from '../core/attributes/BufferAttribute.js';
import { Geometry } from '../core/Geometry.js';
import { Box3 } from '@modules/renderer/engine/math/Box3.js';
import { ColorRepresentation } from '@modules/renderer/engine/math/Color.js';

export class Box3Helper extends LineSegments {
  declare type: string | 'Box3Helper';
  box: Box3;

  constructor(box: Box3, color: ColorRepresentation = 0xffff00) {
    const indices = new Uint16Array([0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7]);

    const positions = [1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1, 1, 1, -1, -1, 1, -1, -1, -1, -1, 1, -1, -1];

    const geometry = new Geometry();

    geometry.setIndex(new BufferAttribute(indices, 1));

    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));

    super(geometry, new LineBasicMaterial({ color: color, toneMapped: false }));

    this.box = box;

    this.type = 'Box3Helper';

    this.geometry.computeBoundingSphere();
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

Box3Helper.prototype.type = 'Box3Helper';
