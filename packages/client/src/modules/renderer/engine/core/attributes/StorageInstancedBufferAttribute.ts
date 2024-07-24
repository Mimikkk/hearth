import { InstancedBufferAttribute } from '@modules/renderer/engine/engine.js';

class StorageInstancedBufferAttribute extends InstancedBufferAttribute<any> {
  declare isStorageInstancedBufferAttribute: true;
}

StorageInstancedBufferAttribute.prototype.isStorageInstancedBufferAttribute = true;

export default StorageInstancedBufferAttribute;
