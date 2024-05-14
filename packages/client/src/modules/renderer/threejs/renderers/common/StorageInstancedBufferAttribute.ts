import { InstancedBufferAttribute } from '../../../threejs/Three.js';
import { NumberArray, TypedArrayConstructor } from '@modules/renderer/threejs/math/MathUtils.js';

class StorageInstancedBufferAttribute extends InstancedBufferAttribute<any> {
  declare isStorageInstancedBufferAttribute: true;

  constructor(array: NumberArray, itemSize: number, typeClass: TypedArrayConstructor = Float32Array) {
    if (ArrayBuffer.isView(array) === false) array = new typeClass(array * itemSize);

    super(array, itemSize, false, 1);

    this.isStorageInstancedBufferAttribute = true;
  }
}

export default StorageInstancedBufferAttribute;
