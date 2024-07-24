import { TypedArray } from '@modules/renderer/engine/math/MathUtils.js';
import { BufferAttribute } from '@modules/renderer/engine/core/attributes/BufferAttribute.js';

export class StorageInstancedBufferAttribute<T extends TypedArray = any> extends BufferAttribute<T> {
  declare isStorageInstancedBufferAttribute: true;

  constructor(array: T, itemSize: number, stride: number = 0) {
    super(array, itemSize, stride, 'instance');
  }
}

StorageInstancedBufferAttribute.prototype.isStorageInstancedBufferAttribute = true;

export default StorageInstancedBufferAttribute;
