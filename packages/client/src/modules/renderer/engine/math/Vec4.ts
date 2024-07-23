import type { Mat4 } from './Mat4.js';
import type { Quaternion } from './Quaternion.js';
import { Const } from '@modules/renderer/engine/math/types.js';
import { AttributeType } from '@modules/renderer/engine/core/types.js';
import { clamp, NumberArray } from '@modules/renderer/engine/math/MathUtils.js';

export class Vec4 {
  declare isVec4: true;

  constructor(
    public x: number = 0,
    public y: number = 0,
    public z: number = 0,
    public w: number = 1,
  ) {}

  get width() {
    return this.z;
  }

  set width(value: number) {
    this.z = value;
  }

  get height() {
    return this.w;
  }

  set height(value: number) {
    this.w = value;
  }

  static new(x: number = 0, y: number = 0, z: number = 0, w: number = 1): Vec4 {
    return new Vec4(x, y, z, w);
  }

  static empty(): Vec4 {
    return Vec4.new();
  }

  static clone(vec: Const<Vec4>, into: Vec4 = Vec4.empty()): Vec4 {
    return into.from(vec);
  }

  static is(vector: any): vector is Vec4 {
    return vector?.isVec4 === true;
  }

  static into(into: Vec4, vector: Const<Vec4>): Vec4 {
    return into.from(vector);
  }

  static from(vector: Const<Vec4>, into: Vec4 = Vec4.empty()): Vec4 {
    return into.from(vector);
  }

  static fromArray(array: Const<NumberArray>, offset: number = 0, into: Vec4 = Vec4.empty()): Vec4 {
    return into.fromArray(array, offset);
  }

  static fromAttribute(attribute: Const<AttributeType>, index: number, into: Vec4 = Vec4.empty()): Vec4 {
    return into.fromAttribute(attribute, index);
  }

  static lerp(from: Const<Vec4>, to: Const<Vec4>, step: number, into: Vec4 = Vec4.empty()): Vec4 {
    return into.asLerp(from, to, step);
  }

  asAdd(a: Const<Vec4>, b: Const<Vec4>): this {
    this.x = a.x + b.x;
    this.y = a.y + b.y;
    this.z = a.z + b.z;
    this.w = a.w + b.w;

    return this;
  }

  asSub(a: Const<Vec4>, b: Const<Vec4>): this {
    this.x = a.x - b.x;
    this.y = a.y - b.y;
    this.z = a.z - b.z;
    this.w = a.w - b.w;

    return this;
  }

  asLerp(from: Const<Vec4>, to: Const<Vec4>, alpha: number): this {
    return this.set(
      from.x + (to.x - from.x) * alpha,
      from.y + (to.y - from.y) * alpha,
      from.z + (to.z - from.z) * alpha,
      from.w + (to.w - from.w) * alpha,
    );
  }

  from(from: Const<Vec4>): this {
    return this.set(from.x, from.y, from.z, from.w);
  }

  fromAttribute(attribute: Const<AttributeType>, index: number): this {
    this.x = attribute.getX(index);
    this.y = attribute.getY(index);
    this.z = attribute.getZ(index);
    this.w = attribute.getW(index);

    return this;
  }

  intoAttribute(attribute: AttributeType, index: number): this {
    attribute.setXYZW(index, this.x, this.y, this.z, this.w);
    return this;
  }

  fromArray(array: Const<NumberArray>, offset: number = 0): this {
    this.x = array[offset];
    this.y = array[offset + 1];
    this.z = array[offset + 2];
    this.w = array[offset + 3];

    return this;
  }

  intoArray<T extends NumberArray>(array: T = [] as never, offset: number = 0): T {
    array[offset] = this.x;
    array[offset + 1] = this.y;
    array[offset + 2] = this.z;
    array[offset + 3] = this.w;

    return array;
  }

  fromMat4Position({ elements: e }: Const<Mat4>): this {
    return this.set(e[12], e[13], e[14], e[15]);
  }

  set(x: number, y: number, z: number, w: number): this {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;

    return this;
  }

  setScalar(scalar: number): this {
    this.x = scalar;
    this.y = scalar;
    this.z = scalar;
    this.w = scalar;

    return this;
  }

  setX(x: number): this {
    this.x = x;

    return this;
  }

  setY(y: number): this {
    this.y = y;

    return this;
  }

  setZ(z: number): this {
    this.z = z;

    return this;
  }

  setW(w: number): this {
    this.w = w;

    return this;
  }

  clone(): Vec4 {
    return Vec4.from(this);
  }

  add({ x, y, z, w }: Const<Vec4>): this {
    return this.set(this.x + x, this.y + y, this.z + z, this.w + w);
  }

  addScalar(scalar: number): this {
    return this.set(this.x + scalar, this.y + scalar, this.z + scalar, this.w + scalar);
  }

  addScaled({ x, y, z, w }: Const<Vec4>, scale: number): this {
    return this.set(this.x + x * scale, this.y + y * scale, this.z + z * scale, this.w + w * scale);
  }

  sub({ x, y, z, w }: Const<Vec4>): this {
    return this.set(this.x - x, this.y - y, this.z - z, this.w - w);
  }

  subScalar(scalar: number): this {
    return this.set(this.x - scalar, this.y - scalar, this.z - scalar, this.w - scalar);
  }

  subScaled({ x, y, z, w }: Const<Vec4>, scale: number): this {
    return this.set(this.x - x * scale, this.y - y * scale, this.z - z * scale, this.w - w * scale);
  }

  mul({ x, y, z, w }: Const<Vec4>): this {
    return this.set(this.x * x, this.y * y, this.z * z, this.w * w);
  }

  mulScalar(scalar: number): this {
    return this.set(this.x * scalar, this.y * scalar, this.z * scalar, this.w * scalar);
  }

  scale(scalar: number): this {
    return this.mulScalar(scalar);
  }

  applyMat4({ elements: e }: Const<Mat4>): this {
    const { x, y, z, w } = this;

    return this.set(
      e[0] * x + e[4] * y + e[8] * z + e[12] * w,
      e[1] * x + e[5] * y + e[9] * z + e[13] * w,
      e[2] * x + e[6] * y + e[10] * z + e[14] * w,
      e[3] * x + e[7] * y + e[11] * z + e[15] * w,
    );
  }

  div({ x, y, z, w }: Const<Vec4>): this {
    return this.set(this.x / x, this.y / y, this.z / z, this.w / w);
  }

  divScalar(scalar: number): this {
    return this.scale(1 / scalar);
  }

  asAxisAngleFromQuaternion({ x, y, z, w }: Const<Quaternion>): this {
    const s = Math.sqrt(1 - w * w);

    if (s < 0.0001) return this.set(1, 0, 0, 2 * Math.acos(w));
    return this.set(x / s, y / s, z / s, 2 * Math.acos(w));
  }

  asAxisAngleFromRotation(matrix: Const<Mat4>): this {
    // variables for result
    let angle, x, y, z;
    // margin to allow for rounding errors
    const epsilon1 = 0.01;
    // margin to distinguish between 0 and 180 degrees
    const epsilon2 = 0.1;
    const te = matrix.elements;
    const m11 = te[0];
    const m12 = te[4];
    const m13 = te[8];
    const m21 = te[1];
    const m22 = te[5];
    const m23 = te[9];
    const m31 = te[2];
    const m32 = te[6];
    const m33 = te[10];

    if (Math.abs(m12 - m21) < epsilon1 && Math.abs(m13 - m31) < epsilon1 && Math.abs(m23 - m32) < epsilon1) {
      // singularity found
      // first check for identity matrix which must have +1 for all terms
      // in leading diagonal and zero in other terms

      if (
        Math.abs(m12 + m21) < epsilon2 &&
        Math.abs(m13 + m31) < epsilon2 &&
        Math.abs(m23 + m32) < epsilon2 &&
        Math.abs(m11 + m22 + m33 - 3) < epsilon2
      ) {
        return this.set(1, 0, 0, 0);
      }

      // otherwise this singularity is angle = 180
      angle = Math.PI;
      const xx = (m11 + 1) / 2;
      const yy = (m22 + 1) / 2;
      const zz = (m33 + 1) / 2;
      const xy = (m12 + m21) / 4;
      const xz = (m13 + m31) / 4;
      const yz = (m23 + m32) / 4;

      if (xx > yy && xx > zz) {
        // m11 is the largest diagonal term
        if (xx < epsilon1) {
          x = 0;
          y = Math.SQRT1_2;
          z = Math.SQRT1_2;
        } else {
          x = Math.sqrt(xx);
          y = xy / x;
          z = xz / x;
        }
      } else if (yy > zz) {
        // m22 is the largest diagonal term
        if (yy < epsilon1) {
          x = Math.SQRT1_2;
          y = 0;
          z = Math.SQRT1_2;
        } else {
          y = Math.sqrt(yy);
          x = xy / y;
          z = yz / y;
        }
      } else {
        // m33 is the largest diagonal term so base result on this
        if (zz < epsilon1) {
          x = Math.SQRT1_2;
          y = Math.SQRT1_2;
          z = 0;
        } else {
          z = Math.sqrt(zz);
          x = xz / z;
          y = yz / z;
        }
      }

      return this.set(x, y, z, angle);
    }

    // as we have reached here there are no singularities so we can handle normally
    let s = Math.sqrt((m32 - m23) * (m32 - m23) + (m13 - m31) * (m13 - m31) + (m21 - m12) * (m21 - m12)); // used to normalize

    if (Math.abs(s) < 0.001) s = 1;
    return this.set((m32 - m23) / s, (m13 - m31) / s, (m21 - m12) / s, Math.acos((m11 + m22 + m33 - 1) / 2));
  }

  min({ x, y, z, w }: Const<Vec4>): this {
    return this.set(Math.min(this.x, x), Math.min(this.y, y), Math.min(this.z, z), Math.min(this.w, w));
  }

  max({ x, y, z, w }: Const<Vec4>): this {
    return this.set(Math.max(this.x, x), Math.max(this.y, y), Math.max(this.z, z), Math.max(this.w, w));
  }

  clamp(min: Const<Vec4>, max: Const<Vec4>): this {
    return this.set(
      clamp(this.x, min.x, max.x),
      clamp(this.y, min.y, max.y),
      clamp(this.z, min.z, max.z),
      clamp(this.w, min.w, max.w),
    );
  }

  clampScalar(min: number, max: number): this {
    return this.set(clamp(this.x, min, max), clamp(this.y, min, max), clamp(this.z, min, max), clamp(this.w, min, max));
  }

  clampLength(min: number, max: number): this {
    const length = this.length();

    return this.divScalar(length || 1).scale(clamp(length, min, max));
  }

  floor(): this {
    return this.set(Math.floor(this.x), Math.floor(this.y), Math.floor(this.z), Math.floor(this.w));
  }

  ceil(): this {
    return this.set(Math.ceil(this.x), Math.ceil(this.y), Math.ceil(this.z), Math.ceil(this.w));
  }

  round(): this {
    return this.set(Math.round(this.x), Math.round(this.y), Math.round(this.z), Math.round(this.w));
  }

  truncate(): this {
    return this.set(Math.trunc(this.x), Math.trunc(this.y), Math.trunc(this.z), Math.trunc(this.w));
  }

  negate(): this {
    return this.set(-this.x, -this.y, -this.z, -this.w);
  }

  dot({ x, y, z, w }: Const<Vec4>): number {
    return this.x * x + this.y * y + this.z * z + this.w * w;
  }

  lengthSq(): number {
    return this.euclideanSq();
  }

  length(): number {
    return this.euclidean();
  }

  euclideanSq(): number {
    return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;
  }

  euclidean(): number {
    return Math.sqrt(this.euclideanSq());
  }

  manhattan(): number {
    return Math.abs(this.x) + Math.abs(this.y) + Math.abs(this.z) + Math.abs(this.w);
  }

  normalize(): this {
    return this.divScalar(this.length() || 1);
  }

  distanceSqTo(vec: Const<Vec4>): number {
    const dx = this.x - vec.x;
    const dy = this.y - vec.y;
    const dz = this.z - vec.z;
    const dw = this.w - vec.w;

    return dx * dx + dy * dy + dz * dz + dw * dw;
  }

  distanceTo(vec: Const<Vec4>): number {
    return Math.sqrt(this.distanceSqTo(vec));
  }

  setLength(length: number): this {
    return this.normalize().scale(length);
  }

  lerp(to: Const<Vec4>, step: number): this {
    return this.asLerp(this, to, step);
  }

  equals({ x, y, z, w }: Const<Vec4>): boolean {
    return x === this.x && y === this.y && z === this.z && w === this.w;
  }

  *[Symbol.iterator](): Iterator<number> {
    yield this.x;
    yield this.y;
    yield this.z;
    yield this.w;
  }
}

Vec4.prototype.isVec4 = true;
