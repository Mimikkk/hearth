import NodeBuffer from '../../renderers/NodeBuffer.js';
import { BufferAttribute } from '@modules/renderer/engine/core/BufferAttribute.js';
import { TypedArray } from '@modules/renderer/engine/math/MathUtils.js';

class StorageBuffer<T extends TypedArray> extends NodeBuffer {
  declare isStorageBuffer: boolean;
  attribute: BufferAttribute<T>;

  constructor(name: string, attribute: BufferAttribute<T>) {
    super(name, attribute ? attribute.array : null);

    this.attribute = attribute;
  }
}

StorageBuffer.prototype.isStorageBuffer = true;

export default StorageBuffer;
