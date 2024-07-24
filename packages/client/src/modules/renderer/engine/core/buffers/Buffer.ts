import type { TypedArray } from '../../math/MathUtils.js';

export class Buffer<T extends TypedArray = any> {
  declare isInterleavedBuffer: true;
  array: T;
  stride: number;
  count: number;

  constructor(array: T, stride: number = 1) {
    this.array = array;
    this.stride = stride;
    this.count = this.array.length / this.stride;
  }
}

Buffer.prototype.isInterleavedBuffer = true;
