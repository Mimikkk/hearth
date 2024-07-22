import { Vec3 } from '../math/Vec3.js';
import { BufferAttribute } from './BufferAttribute.js';
import { denormalize, normalize, TypedArray } from '../math/MathUtils.js';
import { InterleavedBuffer } from '@modules/renderer/engine/core/InterleavedBuffer.js';
import { Mat4 } from '@modules/renderer/engine/math/Mat4.js';
import { Matrix, Mat3 } from '@modules/renderer/engine/math/Mat3.js';

const _vector = /*@__PURE__*/ new Vec3();

export class InterleavedBufferAttribute<T extends TypedArray = any> {
  declare ['constructor']: typeof InterleavedBufferAttribute;
  declare isInterleavedBufferAttribute: true;
  name: string;
  data: InterleavedBuffer<T>;
  itemSize: number;
  offset: number;
  normalized: boolean;

  constructor(interleavedBuffer: InterleavedBuffer, itemSize: number, offset: number, normalized: boolean = false) {
    this.name = '';
    this.data = interleavedBuffer;
    this.itemSize = itemSize;
    this.offset = offset;
    this.normalized = normalized;
  }

  get count(): number {
    return this.data.count;
  }

  get array(): TypedArray {
    return this.data.array;
  }

  set needsUpdate(value: boolean) {
    this.data.needsUpdate = value;
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

    if (this.normalized) value = denormalize(value, this.array);

    return value;
  }

  setComponent(index: number, component: number, value: number): this {
    if (this.normalized) value = normalize(value, this.array);

    this.data.array[index * this.data.stride + this.offset + component] = value;

    return this;
  }

  setX(index: number, x: number): this {
    if (this.normalized) x = normalize(x, this.array);

    this.data.array[index * this.data.stride + this.offset] = x;

    return this;
  }

  setY(index: number, y: number): this {
    if (this.normalized) y = normalize(y, this.array);

    this.data.array[index * this.data.stride + this.offset + 1] = y;

    return this;
  }

  setZ(index: number, z: number): this {
    if (this.normalized) z = normalize(z, this.array);

    this.data.array[index * this.data.stride + this.offset + 2] = z;

    return this;
  }

  setW(index: number, w: number): this {
    if (this.normalized) w = normalize(w, this.array);

    this.data.array[index * this.data.stride + this.offset + 3] = w;

    return this;
  }

  getX(index: number): number {
    let x = this.data.array[index * this.data.stride + this.offset];

    if (this.normalized) x = denormalize(x, this.array);

    return x;
  }

  getY(index: number): number {
    let y = this.data.array[index * this.data.stride + this.offset + 1];

    if (this.normalized) y = denormalize(y, this.array);

    return y;
  }

  getZ(index: number): number {
    let z = this.data.array[index * this.data.stride + this.offset + 2];

    if (this.normalized) z = denormalize(z, this.array);

    return z;
  }

  getW(index: number): number {
    let w = this.data.array[index * this.data.stride + this.offset + 3];

    if (this.normalized) w = denormalize(w, this.array);

    return w;
  }

  setXY(index: number, x: number, y: number): this {
    index = index * this.data.stride + this.offset;

    if (this.normalized) {
      x = normalize(x, this.array);
      y = normalize(y, this.array);
    }

    this.data.array[index + 0] = x;
    this.data.array[index + 1] = y;

    return this;
  }

  setXYZ(index: number, x: number, y: number, z: number): this {
    index = index * this.data.stride + this.offset;

    if (this.normalized) {
      x = normalize(x, this.array);
      y = normalize(y, this.array);
      z = normalize(z, this.array);
    }

    this.data.array[index + 0] = x;
    this.data.array[index + 1] = y;
    this.data.array[index + 2] = z;

    return this;
  }

  setXYZW(index: number, x: number, y: number, z: number, w: number): this {
    index = index * this.data.stride + this.offset;

    if (this.normalized) {
      x = normalize(x, this.array);
      y = normalize(y, this.array);
      z = normalize(z, this.array);
      w = normalize(w, this.array);
    }

    this.data.array[index + 0] = x;
    this.data.array[index + 1] = y;
    this.data.array[index + 2] = z;
    this.data.array[index + 3] = w;

    return this;
  }

  clone(data?: InterleavedBufferAttribute): this {
    if (data === undefined) {
      console.info(
        'engine.InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.',
      );

      const array = [];

      for (let i = 0; i < this.count; i++) {
        const index = i * this.data.stride + this.offset;

        for (let j = 0; j < this.itemSize; j++) {
          array.push(this.data.array[index + j]);
        }
      }

      return new BufferAttribute(new this.array.constructor(array), this.itemSize, this.normalized);
    } else {
      if (data.interleavedBuffers === undefined) {
        data.interleavedBuffers = {};
      }

      if (data.interleavedBuffers[this.data.uuid] === undefined) {
        data.interleavedBuffers[this.data.uuid] = this.data.clone(data);
      }

      return new InterleavedBufferAttribute(
        data.interleavedBuffers[this.data.uuid],
        this.itemSize,
        this.offset,
        this.normalized,
      );
    }
  }
}
InterleavedBufferAttribute.prototype.isInterleavedBufferAttribute = true;
