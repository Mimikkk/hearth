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

  copy(source: InstancedInterleavedBuffer): this {
    super.copy(source);

    this.meshPerAttribute = source.meshPerAttribute;

    return this;
  }

  clone(data: InstancedInterleavedBuffer): this {
    const ib = super.clone(data);

    ib.meshPerAttribute = this.meshPerAttribute;

    return ib;
  }

  toJSON(data: InstancedInterleavedBuffer): any {
    const json = super.toJSON(data);

    json.isInstancedInterleavedBuffer = true;
    json.meshPerAttribute = this.meshPerAttribute;

    return json;
  }
}
InstancedInterleavedBuffer.prototype.isInstancedInterleavedBuffer = true;
