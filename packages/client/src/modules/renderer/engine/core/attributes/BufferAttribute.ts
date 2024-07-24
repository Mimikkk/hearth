import { Vec3 } from '../../math/Vec3.js';
import { Vec2 } from '../../math/Vec2.js';
import { TypedArray, TypedArrayConstructor } from '../../math/MathUtils.js';
import { BufferUsage } from '../../constants.js';
import { Mat3 } from '@modules/renderer/engine/math/Mat3.js';
import { Mat4 } from '@modules/renderer/engine/math/Mat4.js';

export class BufferAttribute<T extends TypedArray = any> {
  declare isBufferAttribute: true;
  name: string;
  array: T;
  stride: number;
  count: number;

  usage: BufferUsage;
  version: number;

  constructor(array: T, stride: number) {
    this.isBufferAttribute = true;

    this.name = '';

    this.array = array;
    this.stride = stride;
    this.count = array.length / stride;

    this.usage = BufferUsage.StaticDraw;

    this.version = 0;
  }

  set needsUpdate(value: boolean) {
    if (value) ++this.version;
  }

  setUsage(value: BufferUsage) {
    this.usage = value;
    return this;
  }

  copy(source: BufferAttribute<T>): this {
    this.name = source.name;
    this.array = new (source.array.constructor as TypedArrayConstructor)(source.array) as T;
    this.stride = source.stride;
    this.count = source.count;
    this.usage = source.usage;

    return this;
  }

  applyMat3(m: Mat3): this {
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

  applyMat4(m: Mat4): this {
    for (let i = 0, l = this.count; i < l; i++) {
      _vec3.fromAttribute(this, i);

      _vec3.applyMat4(m);

      this.setXYZ(i, _vec3.x, _vec3.y, _vec3.z);
    }

    return this;
  }

  applyNormalMatrix(m: Mat3): this {
    for (let i = 0, l = this.count; i < l; i++) {
      _vec3.fromAttribute(this, i);

      _vec3.applyNMat3(m);

      this.setXYZ(i, _vec3.x, _vec3.y, _vec3.z);
    }

    return this;
  }

  transformDirection(m: Mat4): this {
    for (let i = 0, l = this.count; i < l; i++) {
      _vec3.fromAttribute(this, i);

      _vec3.transformDirection(m);

      this.setXYZ(i, _vec3.x, _vec3.y, _vec3.z);
    }

    return this;
  }

  set(value: number[], offset: number = 0): this {
    // Matching BufferAttribute constructor, do not normalize the array.
    this.array.set(value, offset);

    return this;
  }

  getComponent(index: number, component: number): number {
    let value = this.array[index * this.stride + component];

    return value;
  }

  setComponent(index: number, component: number, value: number): this {
    this.array[index * this.stride + component] = value;

    return this;
  }

  getX(index: number): number {
    let x = this.array[index * this.stride];

    return x;
  }

  setX(index: number, x: number): this {
    this.array[index * this.stride] = x;

    return this;
  }

  getY(index: number): number {
    let y = this.array[index * this.stride + 1];

    return y;
  }

  setY(index: number, y: number): this {
    this.array[index * this.stride + 1] = y;

    return this;
  }

  getZ(index: number): number {
    let z = this.array[index * this.stride + 2];

    return z;
  }

  setZ(index: number, z: number): this {
    this.array[index * this.stride + 2] = z;

    return this;
  }

  getW(index: number): number {
    let w = this.array[index * this.stride + 3];

    return w;
  }

  setW(index: number, w: number): this {
    this.array[index * this.stride + 3] = w;

    return this;
  }

  setXY(index: number, x: number, y: number): this {
    index *= this.stride;

    this.array[index + 0] = x;
    this.array[index + 1] = y;

    return this;
  }

  setXYZ(index: number, x: number, y: number, z: number): this {
    index *= this.stride;

    this.array[index + 0] = x;
    this.array[index + 1] = y;
    this.array[index + 2] = z;

    return this;
  }

  setXYZW(index: number, x: number, y: number, z: number, w: number): this {
    index *= this.stride;

    this.array[index + 0] = x;
    this.array[index + 1] = y;
    this.array[index + 2] = z;
    this.array[index + 3] = w;

    return this;
  }

  clone(): BufferAttribute<T> {
    return new BufferAttribute(this.array, this.stride).copy(this);
  }
}
BufferAttribute.prototype.isBufferAttribute = true;

const _Vec2 = Vec2.new();
const _vec3 = Vec3.new();
