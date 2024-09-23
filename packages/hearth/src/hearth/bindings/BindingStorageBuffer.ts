import { BindingBuffer } from './BindingBuffer.js';
import { Attribute } from '../../core/Attribute.js';
import { TypedArray } from '../../math/MathUtils.js';

export class BindingStorageBuffer<T extends TypedArray = any> extends BindingBuffer {
  declare isStorageBuffer: boolean;

  constructor(
    name: string,
    public attribute: Attribute<T>,
  ) {
    super(name, attribute?.array);
  }

  static is(value: any): value is BindingStorageBuffer {
    return value?.isStorageBuffer === true;
  }
}

BindingStorageBuffer.prototype.isStorageBuffer = true;
