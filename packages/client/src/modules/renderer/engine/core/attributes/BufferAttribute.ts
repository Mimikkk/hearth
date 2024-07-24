import { Vec3 } from '../../math/Vec3.js';
import { Vec2 } from '../../math/Vec2.js';
import { NumberArray, TypedArray, TypedArrayConstructor } from '../../math/MathUtils.js';
import { BufferUsage } from '../../constants.js';
import { Mat3 } from '@modules/renderer/engine/math/Mat3.js';
import { Mat4 } from '@modules/renderer/engine/math/Mat4.js';
import { Buffer } from '../buffers/Buffer.js';
import { Const } from '@modules/renderer/engine/math/types.js';

export class BufferAttribute<T extends TypedArray = any> {
  declare isBufferAttribute: true;
  source: Buffer<T>;
  name: string;
  array: T;

  stride: number;
  offset: number;

  usage: BufferUsage;

  constructor(source: T, stride: number, offset: number = 0) {
    this.name = '';

    this.array = source;
    this.stride = stride;

    this.offset = offset;
    this.source = new Buffer(source, stride);

    this.usage = BufferUsage.StaticDraw;

    this.version = 0;
  }

  set count(count: number) {
    this.source.count = count;
  }

  get count(): number {
    return this.source.count;
  }

  setUsage(value: BufferUsage) {
    this.usage = value;
    return this;
  }

  applyMat3(m: Const<Mat3>): this {
    if (this.stride === 2) {
      for (let i = 0, l = this.count; i < l; i++) {
        _Vec2.fromAttribute(this, i);
        _Vec2.applyMat3(m);

        this.setXY(i, _Vec2.x, _Vec2.y);
      }
    } else if (this.stride === 3) {
      for (let i = 0, l = this.count; i < l; i++) {
        _vec3.fromAttribute(this, i);
        _vec3.applyMat3(m);

        this.setXYZ(i, _vec3.x, _vec3.y, _vec3.z);
      }
    }

    return this;
  }

  applyMat4(m: Const<Mat4>): this {
    for (let i = 0, l = this.count; i < l; i++) {
      _vec3.fromAttribute(this, i);

      _vec3.applyMat4(m);

      this.setXYZ(i, _vec3.x, _vec3.y, _vec3.z);
    }

    return this;
  }

  applyNMat3(m: Const<Mat3>): this {
    for (let i = 0, l = this.count; i < l; i++) {
      _vec3.fromAttribute(this, i);

      _vec3.applyNMat3(m);

      this.setXYZ(i, _vec3.x, _vec3.y, _vec3.z);
    }

    return this;
  }

  transformDirection(m: Const<Mat4>): this {
    for (let i = 0, l = this.count; i < l; i++) {
      _vec3.fromAttribute(this, i);

      _vec3.transformDirection(m);

      this.setXYZ(i, _vec3.x, _vec3.y, _vec3.z);
    }

    return this;
  }

  set(value: Const<NumberArray>, offset: number = 0): this {
    this.source.array.set(value, offset);
    return this;
  }

  getN(index: number, n: number): number {
    return this.source.array[index * this.source.stride + this.offset + n];
  }

  setN(index: number, n: number, value: number): this {
    this.source.array[index * this.source.stride + this.offset + n] = value;
    return this;
  }

  setX(index: number, x: number): this {
    this.source.array[index * this.source.stride + this.offset] = x;
    return this;
  }

  getX(index: number): number {
    return this.source.array[index * this.source.stride + this.offset];
  }

  setY(index: number, y: number): this {
    this.source.array[index * this.source.stride + this.offset + 1] = y;
    return this;
  }

  getY(index: number): number {
    return this.source.array[index * this.source.stride + this.offset + 1];
  }

  setZ(index: number, z: number): this {
    this.source.array[index * this.source.stride + this.offset + 2] = z;
    return this;
  }

  getZ(index: number): number {
    return this.source.array[index * this.source.stride + this.offset + 2];
  }

  setW(index: number, w: number): this {
    this.source.array[index * this.source.stride + this.offset + 3] = w;
    return this;
  }

  getW(index: number): number {
    return this.source.array[index * this.source.stride + this.offset + 3];
  }

  setXY(index: number, x: number, y: number): this {
    index = index * this.source.stride + this.offset;
    this.source.array[index + 0] = x;
    this.source.array[index + 1] = y;

    return this;
  }

  setXYZ(index: number, x: number, y: number, z: number): this {
    index = index * this.source.stride + this.offset;
    this.source.array[index + 0] = x;
    this.source.array[index + 1] = y;
    this.source.array[index + 2] = z;

    return this;
  }

  setXYZW(index: number, x: number, y: number, z: number, w: number): this {
    index = index * this.source.stride + this.offset;
    this.source.array[index + 0] = x;
    this.source.array[index + 1] = y;
    this.source.array[index + 2] = z;
    this.source.array[index + 3] = w;

    return this;
  }

  copy(source: BufferAttribute<T>): this {
    this.name = source.name;
    this.stride = source.stride;
    this.count = source.count;
    this.usage = source.usage;

    return this;
  }

  clone(): BufferAttribute<T> {
    return new BufferAttribute(this.array, this.stride).copy(this);
  }
}
BufferAttribute.prototype.isBufferAttribute = true;

const _Vec2 = Vec2.new();
const _vec3 = Vec3.new();
