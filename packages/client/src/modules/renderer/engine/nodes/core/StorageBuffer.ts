import BindingBuffer from '../../renderers/bindings/BindingBuffer.js';
import { Attribute } from '@modules/renderer/engine/core/Attribute.js';
import { TypedArray } from '@modules/renderer/engine/math/MathUtils.js';

class StorageBuffer<T extends TypedArray = any> extends BindingBuffer {
  declare isStorageBuffer: boolean;
  attribute: Attribute<T>;

  constructor(name: string, attribute: Attribute<T>) {
    super(name, attribute.array);

    this.attribute = attribute;
  }
}

StorageBuffer.prototype.isStorageBuffer = true;

export default StorageBuffer;
