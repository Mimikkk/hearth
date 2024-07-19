import { Vec3 } from '../math/Vec3.js';
import { Vec2 } from '../math/Vec2.js';
import { denormalize, normalize, TypedArray, TypedArrayConstructor } from '../math/MathUtils.js';
import { BufferUsage, TextureDataType } from '../constants.js';
import { Mat3 } from '@modules/renderer/engine/math/Mat3.js';
import { Mat4 } from '@modules/renderer/engine/math/Mat4.js';
import { Const } from '@modules/renderer/engine/math/types.js';

export class BufferAttribute<T extends TypedArray = any> {
  declare ['constructor']: typeof BufferAttribute<T>;
  declare isBufferAttribute: true;
  name: string;
  array: T;
  itemSize: number;
  count: number;
  normalized: boolean;
  usage: BufferUsage;
  _updateRange: { offset: number; count: number };
  updateRanges: { start: number; count: number }[];
  gpuType: TextureDataType;
  version: number;

  constructor(array: T, itemSize: number, normalized: boolean = false) {
    this.isBufferAttribute = true;

    this.name = '';

    this.array = array;
    this.itemSize = itemSize;
    this.count = array !== undefined ? array.length / itemSize : 0;
    this.normalized = normalized;

    this.usage = BufferUsage.StaticDraw;
    this._updateRange = { offset: 0, count: -1 };
    this.updateRanges = [];
    this.gpuType = TextureDataType.Float;

    this.version = 0;
  }

  set needsUpdate(value: boolean) {
    if (value) ++this.version;
  }

  setUsage(value: BufferUsage) {
    this.usage = value;
    return this;
  }

  addUpdateRange(start: number, count: number) {
    this.updateRanges.push({ start, count });
  }

  clearUpdateRanges() {
    this.updateRanges.length = 0;
  }

  copy(source: BufferAttribute<T>): this {
    this.name = source.name;
    this.array = new (source.array.constructor as TypedArrayConstructor)(source.array) as T;
    this.itemSize = source.itemSize;
    this.count = source.count;
    this.normalized = source.normalized;

    this.usage = source.usage;
    this.gpuType = source.gpuType;

    return this;
  }

  setAt(at: number, attribute: BufferAttribute<T>, from: number): this {
    at *= this.itemSize;
    from *= attribute.itemSize;

    for (let i = 0, l = this.itemSize; i < l; i++) {
      this.array[at + i] = attribute.array[from + i];
    }

    return this;
  }

  setArray(array: number[]): this {
    this.array.set(array);
    return this;
  }

  applyMat3(m: Const<Mat3>): this {
    if (this.itemSize === 2) {
      for (let i = 0, l = this.count; i < l; i++) {
        _vec2.fromAttribute(this, i);
        _vec2.applyMat3(m);

        this.setXY(i, _vec2.x, _vec2.y);
      }
    } else if (this.itemSize === 3) {
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
      _vec3.fromAttribute(this, i).transformDirection(m);
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
    let value = this.array[index * this.itemSize + component];

    if (this.normalized) value = denormalize(value, this.array);

    return value;
  }

  setComponent(index: number, component: number, value: number): this {
    if (this.normalized) value = normalize(value, this.array);

    this.array[index * this.itemSize + component] = value;

    return this;
  }

  getX(index: number): number {
    let x = this.array[index * this.itemSize];

    if (this.normalized) x = denormalize(x, this.array);

    return x;
  }

  setX(index: number, x: number): this {
    if (this.normalized) x = normalize(x, this.array);

    this.array[index * this.itemSize] = x;

    return this;
  }

  getY(index: number): number {
    let y = this.array[index * this.itemSize + 1];

    if (this.normalized) y = denormalize(y, this.array);

    return y;
  }

  setY(index: number, y: number): this {
    if (this.normalized) y = normalize(y, this.array);

    this.array[index * this.itemSize + 1] = y;

    return this;
  }

  getZ(index: number): number {
    let z = this.array[index * this.itemSize + 2];

    if (this.normalized) z = denormalize(z, this.array);

    return z;
  }

  setZ(index: number, z: number): this {
    if (this.normalized) z = normalize(z, this.array);

    this.array[index * this.itemSize + 2] = z;

    return this;
  }

  getW(index: number): number {
    let w = this.array[index * this.itemSize + 3];

    if (this.normalized) w = denormalize(w, this.array);

    return w;
  }

  setW(index: number, w: number): this {
    if (this.normalized) w = normalize(w, this.array);

    this.array[index * this.itemSize + 3] = w;

    return this;
  }

  setXY(index: number, x: number, y: number): this {
    index *= this.itemSize;

    if (this.normalized) {
      x = normalize(x, this.array);
      y = normalize(y, this.array);
    }

    this.array[index + 0] = x;
    this.array[index + 1] = y;

    return this;
  }

  setXYZ(index: number, x: number, y: number, z: number): this {
    index *= this.itemSize;

    if (this.normalized) {
      x = normalize(x, this.array);
      y = normalize(y, this.array);
      z = normalize(z, this.array);
    }

    this.array[index + 0] = x;
    this.array[index + 1] = y;
    this.array[index + 2] = z;

    return this;
  }

  setXYZW(index: number, x: number, y: number, z: number, w: number): this {
    index *= this.itemSize;

    if (this.normalized) {
      x = normalize(x, this.array);
      y = normalize(y, this.array);
      z = normalize(z, this.array);
      w = normalize(w, this.array);
    }

    this.array[index + 0] = x;
    this.array[index + 1] = y;
    this.array[index + 2] = z;
    this.array[index + 3] = w;

    return this;
  }

  clone(): BufferAttribute<T> {
    return new BufferAttribute<T>(this.array, this.itemSize).copy(this);
  }
}
BufferAttribute.prototype.isBufferAttribute = true;

const _vec3 = Vec3.new();
const _vec2 = Vec2.new();

export class Uint16BufferAttribute extends BufferAttribute<Uint16Array> {
  constructor(array: number[], itemSize: number, normalized?: boolean) {
    super(new Uint16Array(array), itemSize, normalized);
  }
}

export class Uint32BufferAttribute extends BufferAttribute<Uint32Array> {
  constructor(array: number[], itemSize: number, normalized?: boolean) {
    super(new Uint32Array(array), itemSize, normalized);
  }
}

export class Float32BufferAttribute extends BufferAttribute<Float32Array> {
  constructor(array: number[], itemSize: number, normalized?: boolean) {
    super(new Float32Array(array), itemSize, normalized);
  }
}
