import * as MathUtils from '../../math/MathUtils.js';
import { TypedArray, TypedArrayConstructor } from '../../math/MathUtils.js';
import { BufferUsage } from '../../constants.js';

export class InterleavedBuffer<T extends TypedArray = any> {
  declare ['constructor']: typeof InterleavedBuffer<T>;
  declare isInterleavedBuffer: true;
  array: T;
  stride: number;
  count: number;
  usage: BufferUsage;
  updateRanges: Array<{ start: number; count: number }>;
  version: number;
  uuid: string;

  constructor(array: T, stride: number) {
    this.array = array;
    this.stride = stride;
    this.count = array !== undefined ? array.length / stride : 0;

    this.usage = BufferUsage.StaticDraw;
    this.updateRanges = [];

    this.version = 0;

    this.uuid = MathUtils.generateUuid();
  }

  onUploadCallback() {}

  set needsUpdate(value: boolean) {
    if (value) ++this.version;
  }

  setUsage(value: BufferUsage): this {
    this.usage = value;

    return this;
  }

  addUpdateRange(start: number, count: number): this {
    this.updateRanges.push({ start, count });
    return this;
  }

  clearUpdateRanges(): this {
    this.updateRanges.length = 0;
    return this;
  }

  copy(source: InterleavedBuffer): this {
    this.array = new (source.array.constructor() as TypedArrayConstructor)(source.array) as T;
    this.count = source.count;
    this.stride = source.stride;
    this.usage = source.usage;

    return this;
  }

  copyAt(index1: number, attribute: InterleavedBuffer, index2: number): this {
    index1 *= this.stride;
    index2 *= attribute.stride;

    for (let i = 0, l = this.stride; i < l; i++) {
      this.array[index1 + i] = attribute.array[index2 + i];
    }

    return this;
  }

  set(value: number[], offset: number = 0): this {
    this.array.set(value, offset);

    return this;
  }

  clone(data?: {}): this {
    //@ts-expect-error
    if (data.arrayBuffers === undefined) {
      //@ts-expect-error
      data.arrayBuffers = {};
    }

    //@ts-expect-error
    if (this.array.buffer._uuid === undefined) {
      //@ts-expect-error
      this.array.buffer._uuid = MathUtils.generateUuid();
    }

    //@ts-expect-error
    if (data.arrayBuffers[this.array.buffer._uuid] === undefined) {
      //@ts-expect-error
      data.arrayBuffers[this.array.buffer._uuid] = this.array.slice(0).buffer;
    }

    //@ts-expect-error
    const array = new this.array.constructor(data.arrayBuffers[this.array.buffer._uuid]);

    const ib = new this.constructor(array, this.stride);
    ib.setUsage(this.usage);

    //@ts-expect-error
    return ib;
  }

  onUpload(callback: () => void): this {
    this.onUploadCallback = callback;

    return this;
  }
}
InterleavedBuffer.prototype.isInterleavedBuffer = true;
