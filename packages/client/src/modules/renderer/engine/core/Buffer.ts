import type { ArrayMap, NumberArray, TypedArray, TypedArrayConstructor } from '../math/MathUtils.js';
import { BufferStep } from '@modules/renderer/engine/hearth/constants.js';
import { BufferUse } from '@modules/renderer/engine/constants.js';

export class Buffer<T extends TypedArray = any> {
  declare isInterleavedBuffer: true;
  count: number;

  constructor(
    public array: T,
    public stride: number,
    public step: BufferStep = BufferStep.Vertex,
    public use: BufferUse = BufferUse.StaticDraw,
  ) {
    this.count = array.length / stride;
  }

  static new<T extends TypedArray>(array: T, stride: number, step?: BufferStep, use?: BufferUse): Buffer<T> {
    return new Buffer(array, stride, step, use);
  }

  static f64(array: NumberArray | number, stride: number, step?: BufferStep, use?: BufferUse): Buffer<Float64Array> {
    return new Buffer(as(array, Float64Array), stride, step, use);
  }

  static f32(array: NumberArray | number, stride: number, step?: BufferStep, use?: BufferUse): Buffer<Float32Array> {
    return new Buffer(as(array, Float32Array), stride, step, use);
  }

  static u32(array: NumberArray | number, stride: number, step?: BufferStep, use?: BufferUse): Buffer<Uint32Array> {
    return new Buffer(as(array, Uint32Array), stride, step, use);
  }

  static u16(array: NumberArray | number, stride: number, step?: BufferStep, use?: BufferUse): Buffer<Uint16Array> {
    return new Buffer(as(array, Uint16Array), stride, step, use);
  }

  static u8(array: NumberArray | number, stride: number, step?: BufferStep, use?: BufferUse): Buffer<Uint8Array> {
    return new Buffer(as(array, Uint8Array), stride, step, use);
  }

  static i32(array: NumberArray | number, stride: number, step?: BufferStep, use?: BufferUse): Buffer<Int32Array> {
    return new Buffer(as(array, Int32Array), stride, step, use);
  }

  static i16(array: NumberArray | number, stride: number, step?: BufferStep, use?: BufferUse): Buffer<Int16Array> {
    return new Buffer(as(array, Int16Array), stride, step, use);
  }

  static i8(array: NumberArray | number, stride: number, step?: BufferStep, use?: BufferUse): Buffer<Int8Array> {
    return new Buffer(as(array, Int8Array), stride, step, use);
  }

  get type(): TypedArrayConstructor {
    return this.array.constructor as never;
  }

  get elementByteSize(): number {
    return this.array.BYTES_PER_ELEMENT;
  }
}

const as = <C extends TypedArrayConstructor>(array: NumberArray | number, Type: C): ArrayMap<C> =>
  (array?.constructor === Type ? array : new Type(array as number)) as ArrayMap<C>;

Buffer.prototype.isInterleavedBuffer = true;
