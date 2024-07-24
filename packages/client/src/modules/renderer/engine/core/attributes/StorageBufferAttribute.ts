import { BufferAttribute } from '@modules/renderer/engine/engine.js';

class StorageBufferAttribute extends BufferAttribute {
  declare isStorageBufferAttribute: true;
}

StorageBufferAttribute.prototype.isStorageBufferAttribute = true;

export default StorageBufferAttribute;
