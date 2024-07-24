import { InstancedBufferAttribute } from '@modules/renderer/engine/engine.js';
import { TypedArray } from '@modules/renderer/engine/math/MathUtils.js';

class StorageInstancedBufferAttribute<T extends TypedArray> extends InstancedBufferAttribute<T> {
  declare isStorageInstancedBufferAttribute: true;
}

StorageInstancedBufferAttribute.prototype.isStorageInstancedBufferAttribute = true;

export default StorageInstancedBufferAttribute;
