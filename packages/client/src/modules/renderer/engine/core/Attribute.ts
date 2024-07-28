import { Vec3 } from '../math/Vec3.js';
import { Vec2 } from '../math/Vec2.js';
import { NumberArray, TypedArray } from '../math/MathUtils.js';
import { BufferUse } from '../constants.js';
import { Mat3 } from '@modules/renderer/engine/math/Mat3.js';
import { Mat4 } from '@modules/renderer/engine/math/Mat4.js';
import { Buffer } from './Buffer.js';
import { Const } from '@modules/renderer/engine/math/types.js';
import { BufferStep, GPUBufferBindingTypeType } from '@modules/renderer/engine/renderers/constants.js';

export class Attribute<T extends TypedArray = any> {
  declare isBufferAttribute: true;
  source: Buffer<T>;
  name: string;
  version: number;

  constructor(
    source: T | Buffer<T>,
    public span: number,
    public offset: number = 0,
    // move into source
    public step: BufferStep = BufferStep.Vertex,
    // move into source
    public bind?: GPUBufferBindingTypeType,
  ) {
    if (source instanceof Buffer) {
      this.source = source;
    } else {
      this.source = new Buffer(source, span);
    }

    this.name = '';
    this.usage = BufferUse.StaticDraw;
    this.version = 0;
  }

  // move into source
  set usage(value: BufferUse) {
    this.source.use = value;
  }

  get usage(): BufferUse {
    return this.source.use;
  }

  get array(): T {
    return this.source.array;
  }

  set stride(value: number) {
    this.source.stride = value;
  }

  get stride(): number {
    return this.source.stride;
  }

  get instanced(): boolean {
    return this.source.step === BufferStep.Instance;
  }

  get storage(): boolean {
    return this.bind === GPUBufferBindingTypeType.Storage;
  }

  get interleaved(): boolean {
    return this.source.stride !== this.span;
  }

  set needsUpdate(value: boolean) {
    if (value) ++this.version;
  }

  set count(count: number) {
    this.source.count = count;
  }

  get count(): number {
    return this.source.count;
  }

  static use<T extends TypedArray = any>(
    buffer: Buffer<T>,
    span: number = buffer.stride,
    offset: number = 0,
  ): Attribute<T> {
    return new Attribute(buffer, span, offset);
  }

  applyMat3(mat: Const<Mat3>): this {
    if (this.span === 2) {
      for (let i = 0, it = this.count; i < it; i++) {
        _Vec2.fromAttribute(this, i).applyMat3(mat);

        this.setXY(i, _Vec2.x, _Vec2.y);
      }
    } else if (this.span === 3) {
      for (let i = 0, it = this.count; i < it; i++) {
        _vec3.fromAttribute(this, i).applyMat3(mat);

        this.setXYZ(i, _vec3.x, _vec3.y, _vec3.z);
      }
    }

    return this;
  }

  applyMat4(mat: Const<Mat4>): this {
    for (let i = 0, it = this.count; i < it; i++) {
      _vec3.fromAttribute(this, i);

      _vec3.applyMat4(mat);

      this.setXYZ(i, _vec3.x, _vec3.y, _vec3.z);
    }

    return this;
  }

  applyNMat3(mat: Const<Mat3>): this {
    for (let i = 0, it = this.count; i < it; i++) {
      _vec3.fromAttribute(this, i).applyNMat3(mat);

      this.setXYZ(i, _vec3.x, _vec3.y, _vec3.z);
    }

    return this;
  }

  transformDirection(mat: Const<Mat4>): this {
    for (let i = 0, l = this.count; i < l; i++) {
      _vec3.fromAttribute(this, i);

      _vec3.transformDirection(mat);

      this.setXYZ(i, _vec3.x, _vec3.y, _vec3.z);
    }

    return this;
  }

  set(values: Const<NumberArray>, offset: number = 0): this {
    this.source.array.set(values, offset);
    return this;
  }

  getN(index: number, n: number): number {
    return this.source.array[index * this.span + this.offset + n];
  }

  setN(index: number, n: number, value: number): this {
    this.source.array[index * this.span + this.offset + n] = value;
    return this;
  }

  setX(index: number, x: number): this {
    this.source.array[index * this.span + this.offset] = x;
    return this;
  }

  getX(index: number): number {
    return this.source.array[index * this.span + this.offset];
  }

  setY(index: number, y: number): this {
    this.source.array[index * this.span + this.offset + 1] = y;
    return this;
  }

  getY(index: number): number {
    return this.source.array[index * this.span + this.offset + 1];
  }

  setZ(index: number, z: number): this {
    this.source.array[index * this.span + this.offset + 2] = z;
    return this;
  }

  getZ(index: number): number {
    return this.source.array[index * this.span + this.offset + 2];
  }

  setW(index: number, w: number): this {
    this.source.array[index * this.span + this.offset + 3] = w;
    return this;
  }

  getW(index: number): number {
    return this.source.array[index * this.span + this.offset + 3];
  }

  setXY(index: number, x: number, y: number): this {
    index = index * this.span + this.offset;
    this.source.array[index + 0] = x;
    this.source.array[index + 1] = y;

    return this;
  }

  setXYZ(index: number, x: number, y: number, z: number): this {
    index = index * this.span + this.offset;
    this.source.array[index + 0] = x;
    this.source.array[index + 1] = y;
    this.source.array[index + 2] = z;

    return this;
  }

  setXYZW(index: number, x: number, y: number, z: number, w: number): this {
    index = index * this.span + this.offset;
    this.source.array[index + 0] = x;
    this.source.array[index + 1] = y;
    this.source.array[index + 2] = z;
    this.source.array[index + 3] = w;

    return this;
  }

  copy(source: Attribute<T>): this {
    this.source = source.source;
    this.usage = source.usage;
    this.name = source.name;

    return this;
  }

  clone(): Attribute<T> {
    return new Attribute(this.array, this.stride).copy(this);
  }

  get format(): GPUVertexFormat {
    const { span } = this;
    const { type, elementByteSize } = this.source;

    if (span == 1) {
      switch (type) {
        case Int32Array:
          return 'sint32';
        case Uint32Array:
          return 'uint32';
        case Float32Array:
          return 'float32';
      }
    } else {
      let prefix: 'sint8' | 'uint8' | 'sint16' | 'uint16' | 'sint32' | 'uint32' | 'float32' | undefined;

      switch (type) {
        case Int8Array:
          prefix = 'sint8';
          break;
        case Uint8Array:
          prefix = 'uint8';
          break;
        case Int16Array:
          prefix = 'sint16';
          break;
        case Uint16Array:
          prefix = 'uint16';
          break;
        case Int32Array:
          prefix = 'sint32';
          break;
        case Uint32Array:
          prefix = 'uint32';
          break;
        case Float32Array:
          prefix = 'float32';
          break;
      }

      if (prefix) {
        const perVertex = elementByteSize * span;
        const bytes = ~~((perVertex + 3) / 4) * 4;
        const size = (bytes / elementByteSize) as 2 | 4;
        return `${prefix}x${size}`;
      }
    }

    throw new Error('Unsupported attribute type.');
  }
}

Attribute.prototype.isBufferAttribute = true;

const _Vec2 = Vec2.new();
const _vec3 = Vec3.new();
