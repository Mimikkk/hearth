import BindingBuffer from './BindingBuffer.js';
import { Attribute } from '@modules/renderer/engine/core/Attribute.js';
import { TypedArray } from '@modules/renderer/engine/math/MathUtils.js';

class BindingStorageBuffer<T extends TypedArray = any> extends BindingBuffer {
  declare isStorageBuffer: boolean;
  attribute: Attribute<T>;

  constructor(name: string, attribute: Attribute<T>) {
    super(name, attribute.array);

    this.attribute = attribute;
  }

  static is(value: any): value is BindingStorageBuffer {
    return value?.isStorageBuffer === true;
  }
}

BindingStorageBuffer.prototype.isStorageBuffer = true;

export default BindingStorageBuffer;
