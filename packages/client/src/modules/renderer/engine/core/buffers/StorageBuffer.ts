import Buffer from '../../renderers/common/Buffer.js';
import { BufferAttribute } from '@modules/renderer/engine/core/attributes/BufferAttribute.js';

class StorageBuffer extends Buffer {
  declare isStorageBuffer: boolean;
  attribute: BufferAttribute<any>;

  constructor(name: string, attribute: BufferAttribute<any>) {
    super(name, attribute ? attribute.array : null);

    this.attribute = attribute;
  }
}

StorageBuffer.prototype.isStorageBuffer = true;

export default StorageBuffer;
