import { InterleavedBuffer } from './InterleavedBuffer.js';
import { TypedArray } from '../../math/MathUtils.js';

export class InstancedInterleavedBuffer<T extends TypedArray> extends InterleavedBuffer<T> {
  declare isInstancedInterleavedBuffer: true;

  constructor(
    array: T,
    stride: number,
    public meshPerAttribute: number = 1,
  ) {
    super(array, stride);
  }

  copy(source: this): this {
    super.copy(source);

    this.meshPerAttribute = source.meshPerAttribute;

    return this;
  }

  clone(into: InstancedInterleavedBuffer<T>): this {
    const buffer = super.clone(into);
    buffer.meshPerAttribute = this.meshPerAttribute;

    return buffer;
  }
}

InstancedInterleavedBuffer.prototype.isInstancedInterleavedBuffer = true;
