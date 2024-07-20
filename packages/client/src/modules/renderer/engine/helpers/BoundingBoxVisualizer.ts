import { Box3, Box3_ } from '../math/Box3.js';
import { LineSegments } from '../objects/LineSegments.js';
import { LineBasicMaterial } from '../materials/LineBasicMaterial.js';
import { BufferAttribute } from '../core/BufferAttribute.js';
import { BufferGeometry } from '../core/BufferGeometry.js';
import { Object3D } from '@modules/renderer/engine/core/Object3D.js';
import { ColorRepresentation } from '@modules/renderer/engine/math/Color.js';

const _box = new Box3();

const indices = new Uint16Array([0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7]);

export class BoundingBoxVisualizer extends LineSegments {
  declare type: string | 'BoxHelper';
  object: Object3D;

  constructor(object: Object3D, color: ColorRepresentation = 0xffff00) {
    const indices = new Uint16Array([0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7]);
    const positions = new Float32Array(24);

    const geometry = new BufferGeometry();
    geometry.index = new BufferAttribute(indices, 1);
    geometry.attributes.position = new BufferAttribute(positions, 3);

    super(geometry, new LineBasicMaterial({ color: color, toneMapped: false }));

    this.object = object;
    this.matrixAutoUpdate = false;
    this.update();
  }

  update() {
    if (this.object) {
      _box.setFromObject(this.object, false);
      Box3_.fillObject(_box, this.object, false);
    }

    if (Box3_.isEmpty(_box)) return;
    const position = this.geometry.attributes.position;

    const { array } = position;
    const { min, max } = _box;
    console.log(_box);

    array[0] = max.x;
    array[1] = max.y;
    array[2] = max.z;
    array[3] = min.x;
    array[4] = max.y;
    array[5] = max.z;
    array[6] = min.x;
    array[7] = min.y;
    array[8] = max.z;
    array[9] = max.x;
    array[10] = min.y;
    array[11] = max.z;
    array[12] = max.x;
    array[13] = max.y;
    array[14] = min.z;
    array[15] = min.x;
    array[16] = max.y;
    array[17] = min.z;
    array[18] = min.x;
    array[19] = min.y;
    array[20] = min.z;
    array[21] = max.x;
    array[22] = min.y;
    array[23] = min.z;

    position.needsUpdate = true;
    this.geometry.computeBoundingSphere();
  }

  copy(source: this, recursive?: boolean): this {
    super.copy(source, recursive);

    this.object = source.object;

    return this;
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }
}

BoundingBoxVisualizer.prototype.type = 'BoxHelper';
