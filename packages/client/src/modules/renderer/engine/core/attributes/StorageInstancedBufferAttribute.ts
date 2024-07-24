import { InstancedBufferAttribute } from '@modules/renderer/engine/engine.js';
import { NumberArray, TypedArrayConstructor } from '@modules/renderer/engine/math/MathUtils.js';

class StorageInstancedBufferAttribute extends InstancedBufferAttribute<any> {
  declare isStorageInstancedBufferAttribute: true;

  constructor(array: NumberArray, itemSize: number, typeClass: TypedArrayConstructor = Float32Array) {
    if (ArrayBuffer.isView(array) === false) array = new typeClass(array * itemSize);

    super(array, itemSize, false, 1);

    this.isStorageInstancedBufferAttribute = true;
  }
}

export default StorageInstancedBufferAttribute;
