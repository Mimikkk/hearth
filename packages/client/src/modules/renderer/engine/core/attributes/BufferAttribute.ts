import { Vec3 } from '../../math/Vec3.js';
import { Vec2 } from '../../math/Vec2.js';
import { TypedArray } from '../../math/MathUtils.js';
import { BufferUsage } from '../../constants.js';
import { Mat3 } from '@modules/renderer/engine/math/Mat3.js';
import { Mat4 } from '@modules/renderer/engine/math/Mat4.js';
import { Buffer } from '../buffers/Buffer.js';

export class BufferAttribute<T extends TypedArray = any> {
  declare isBufferAttribute: true;
  name: string = '';
  usage: BufferUsage = BufferUsage.StaticDraw;
  version: number = 0;

  constructor(
    public source: Buffer<T>,
    public stride: number,
    public offset: number = 0,
  ) {
    if (!_sources.includes(source)) {
      _sources.push(source);
      console.log({ source, _sources });
    }

    if (ArrayBuffer.isView(source)) {
      this.source = new Buffer(source as T, stride);
    }
  }

  get count(): number {
    return this.source.count;
  }

  set count(count: number) {
    this.source.count = count;
  }

  get array(): T {
    return this.source.array;
  }

  set needsUpdate(value: boolean) {
    if (value) ++this.version;
  }

  setUsage(value: BufferUsage) {
    this.usage = value;
    return this;
  }

  from(source: BufferAttribute<T>): this {
    this.source = source.source;
    this.stride = source.stride;
    this.usage = source.usage;
    this.name = source.name;

    return this;
  }

  clone(into = new BufferAttribute(this.source, this.stride, this.offset)): BufferAttribute<T> {
    return into.from(this);
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
    this.array.set(value, offset);
    return this;
  }

  getComponent(index: number, component: number): number {
    let value = this.array[index * this.source.stride + this.offset + component];

    return value;
  }

  setComponent(index: number, component: number, value: number): this {
    this.array[index * this.source.stride + this.offset + component] = value;

    return this;
  }

  getX(index: number): number {
    let x = this.array[index * this.source.stride + this.offset];

    return x;
  }

  setX(index: number, x: number): this {
    this.array[index * this.source.stride + this.offset] = x;

    return this;
  }

  getY(index: number): number {
    let y = this.array[index * this.source.stride + this.offset + 1];

    return y;
  }

  setY(index: number, y: number): this {
    this.array[index * this.source.stride + this.offset + 1] = y;

    return this;
  }

  getZ(index: number): number {
    let z = this.array[index * this.source.stride + this.offset + 2];

    return z;
  }

  setZ(index: number, z: number): this {
    this.array[index * this.source.stride + this.offset + 2] = z;

    return this;
  }

  getW(index: number): number {
    let w = this.array[index * this.source.stride + this.offset + 3];

    return w;
  }

  setW(index: number, w: number): this {
    this.array[index * this.source.stride + this.offset + 3] = w;

    return this;
  }

  setXY(index: number, x: number, y: number): this {
    index = index * this.source.stride + this.offset;

    this.array[index + 0] = x;
    this.array[index + 1] = y;

    return this;
  }

  setXYZ(index: number, x: number, y: number, z: number): this {
    index = index * this.source.stride + this.offset;

    this.array[index + 0] = x;
    this.array[index + 1] = y;
    this.array[index + 2] = z;

    return this;
  }

  setXYZW(index: number, x: number, y: number, z: number, w: number): this {
    index = index * this.source.stride + this.offset;

    this.array[index + 0] = x;
    this.array[index + 1] = y;
    this.array[index + 2] = z;
    this.array[index + 3] = w;

    return this;
  }
}

BufferAttribute.prototype.isBufferAttribute = true;

const _Vec2 = Vec2.new();
const _vec3 = Vec3.new();
const _sources = [];
