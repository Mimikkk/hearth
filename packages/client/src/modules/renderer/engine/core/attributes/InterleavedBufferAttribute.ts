import { Vec3 } from '../../math/Vec3.js';
import { TypedArray } from '../../math/MathUtils.js';
import { Buffer } from '@modules/renderer/engine/core/buffers/Buffer.js';
import { Mat4 } from '@modules/renderer/engine/math/Mat4.js';
import { Mat3 } from '@modules/renderer/engine/math/Mat3.js';

const _vector = Vec3.new();

export class InterleavedBufferAttribute<T extends TypedArray = any> {
  declare ['constructor']: typeof InterleavedBufferAttribute;
  declare isInterleavedBufferAttribute: true;
  name: string;
  data: Buffer<T>;
  itemSize: number;
  offset: number;

  constructor(interleavedBuffer: Buffer, itemSize: number, offset: number) {
    this.name = '';
    this.data = interleavedBuffer;
    this.itemSize = itemSize;
    this.offset = offset;
  }

  get count(): number {
    return this.data.count;
  }

  get array(): TypedArray {
    return this.data.array;
  }

  applyMat4(m: Mat4): this {
    for (let i = 0, l = this.data.count; i < l; i++) {
      _vector.fromAttribute(this, i);

      _vector.applyMat4(m);

      this.setXYZ(i, _vector.x, _vector.y, _vector.z);
    }

    return this;
  }

  applyNormalMatrix(m: Mat3): this {
    for (let i = 0, l = this.count; i < l; i++) {
      _vector.fromAttribute(this, i);

      _vector.applyNMat3(m);

      this.setXYZ(i, _vector.x, _vector.y, _vector.z);
    }

    return this;
  }

  transformDirection(m: Mat4): this {
    for (let i = 0, l = this.count; i < l; i++) {
      _vector.fromAttribute(this, i);

      _vector.transformDirection(m);

      this.setXYZ(i, _vector.x, _vector.y, _vector.z);
    }

    return this;
  }

  getComponent(index: number, component: number): number {
    let value = this.array[index * this.data.stride + this.offset + component];

    return value;
  }

  setComponent(index: number, component: number, value: number): this {
    this.data.array[index * this.data.stride + this.offset + component] = value;

    return this;
  }

  setX(index: number, x: number): this {
    this.data.array[index * this.data.stride + this.offset] = x;

    return this;
  }

  setY(index: number, y: number): this {
    this.data.array[index * this.data.stride + this.offset + 1] = y;

    return this;
  }

  setZ(index: number, z: number): this {
    this.data.array[index * this.data.stride + this.offset + 2] = z;

    return this;
  }

  setW(index: number, w: number): this {
    this.data.array[index * this.data.stride + this.offset + 3] = w;

    return this;
  }

  getX(index: number): number {
    let x = this.data.array[index * this.data.stride + this.offset];

    return x;
  }

  getY(index: number): number {
    let y = this.data.array[index * this.data.stride + this.offset + 1];

    return y;
  }

  getZ(index: number): number {
    let z = this.data.array[index * this.data.stride + this.offset + 2];

    return z;
  }

  getW(index: number): number {
    let w = this.data.array[index * this.data.stride + this.offset + 3];

    return w;
  }

  setXY(index: number, x: number, y: number): this {
    index = index * this.data.stride + this.offset;

    this.data.array[index + 0] = x;
    this.data.array[index + 1] = y;

    return this;
  }

  setXYZ(index: number, x: number, y: number, z: number): this {
    index = index * this.data.stride + this.offset;

    this.data.array[index + 0] = x;
    this.data.array[index + 1] = y;
    this.data.array[index + 2] = z;

    return this;
  }

  setXYZW(index: number, x: number, y: number, z: number, w: number): this {
    index = index * this.data.stride + this.offset;

    this.data.array[index + 0] = x;
    this.data.array[index + 1] = y;
    this.data.array[index + 2] = z;
    this.data.array[index + 3] = w;

    return this;
  }
}

InterleavedBufferAttribute.prototype.isInterleavedBufferAttribute = true;
