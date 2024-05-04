import { InterleavedBuffer } from './InterleavedBuffer.js';
import { TypedArray } from '../math/MathUtils.js';

export class InstancedInterleavedBuffer extends InterleavedBuffer {
  declare ['constructor']: typeof InstancedInterleavedBuffer;
  declare isInstancedInterleavedBuffer: true;

  constructor(
    array: TypedArray,
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

  clone(data: InstancedInterleavedBuffer): this {
    const ib = super.clone(data);

    ib.meshPerAttribute = this.meshPerAttribute;

    return ib;
  }
}
InstancedInterleavedBuffer.prototype.isInstancedInterleavedBuffer = true;
