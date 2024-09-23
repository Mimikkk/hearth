import { clamp, NumberArray } from './MathUtils.js';
import type { Euler } from './Euler.js';
import type { Vec3 } from './Vec3.js';
import type { Mat4 } from './Mat4.js';
import { Const } from './types.js';
import { Attribute } from '../core/Attribute.js';

export class Quaternion {
  declare isQuaternion: true;

  constructor(
    public x: number = 0,
    public y: number = 0,
    public z: number = 0,
    public w: number = 1,
  ) {}

  static new(x: number = 0, y: number = 0, z: number = 0, w: number = 1): Quaternion {
    return new Quaternion(x, y, z, w);
  }

  static empty(): Quaternion {
    return Quaternion.new();
  }

  static identity(): Quaternion {
    return Quaternion.new();
  }

  static clone(from: Const<Quaternion>, into: Quaternion = Quaternion.new()): Quaternion {
    return into.from(from);
  }

  static is(from: any): from is Quaternion {
    return from?.isQuaternion === true;
  }

  static into(into: Quaternion, from: Const<Quaternion>): Quaternion {
    return into.from(from);
  }

  static from(from: Const<Quaternion>, into: Quaternion = Quaternion.new()): Quaternion {
    return into.from(from);
  }

  static fromArray(array: Const<NumberArray>, offset: number = 0, into: Quaternion = Quaternion.new()): Quaternion {
    return into.fromArray(array, offset);
  }

  static fromEuler(euler: Const<Euler>, into: Quaternion = Quaternion.new()): Quaternion {
    return into.fromEuler(euler);
  }

  static fromRotation(matrix: Const<Mat4>, into: Quaternion = Quaternion.new()): Quaternion {
    return into.fromRotation(matrix);
  }

  static fromAxisAngle(axis: Const<Vec3>, angle: number, into: Quaternion = Quaternion.new()): Quaternion {
    return into.fromAxisAngle(axis, angle);
  }

  static fromAttribute(attribute: Attribute, index: number, into: Quaternion = Quaternion.new()): Quaternion {
    return into.fromAttribute(attribute, index);
  }

  static fromUnit(from: Const<Vec3>, to: Const<Vec3>, into: Quaternion = Quaternion.new()): Quaternion {
    return into.fromUnit(from, to);
  }

  static slerp(
    from: Const<Quaternion>,
    to: Const<Quaternion>,
    step: number,
    into: Quaternion = Quaternion.new(),
  ): Quaternion {
    return into.asSlerp(from, to, step);
  }

  clone(into: Quaternion = Quaternion.new()): Quaternion {
    return into.from(this);
  }

  set(x: number, y: number, z: number, w: number): this {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
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

  from({ x, y, z, w }: Const<Quaternion>): this {
    return this.set(x, y, z, w);
  }

  fromArray(array: Const<NumberArray>, offset: number = 0): this {
    return this.set(array[offset], array[offset + 1], array[offset + 2], array[offset + 3]);
  }

  intoArray<T extends NumberArray>(array: T = [] as never, offset: number = 0): T {
    array[offset] = this.x;
    array[offset + 1] = this.y;
    array[offset + 2] = this.z;
    array[offset + 3] = this.w;
    return array;
  }

  fromRotation({ elements: e }: Const<Mat4>): this {
    const m11 = e[0];
    const m12 = e[4];
    const m13 = e[8];
    const m21 = e[1];
    const m22 = e[5];
    const m23 = e[9];
    const m31 = e[2];
    const m32 = e[6];
    const m33 = e[10];
    const trace = m11 + m22 + m33;

    if (trace > 0) {
      const s = 0.5 / Math.sqrt(trace + 1.0);

      return this.set((m32 - m23) * s, (m13 - m31) * s, (m21 - m12) * s, 0.25 / s);
    }

    if (m11 > m22 && m11 > m33) {
      const s = 2.0 * Math.sqrt(1.0 + m11 - m22 - m33);

      return this.set(0.25 * s, (m12 + m21) / s, (m13 + m31) / s, (m32 - m23) / s);
    }

    if (m22 > m33) {
      const s = 2.0 * Math.sqrt(1.0 + m22 - m11 - m33);
      return this.set((m12 + m21) / s, 0.25 * s, (m23 + m32) / s, (m13 - m31) / s);
    }

    const s = 2.0 * Math.sqrt(1.0 + m33 - m11 - m22);
    return this.set((m13 + m31) / s, (m23 + m32) / s, 0.25 * s, (m21 - m12) / s);
  }

  fromAxisAngle({ x, y, z }: Const<Vec3>, angle: number): this {
    const halfAngle = angle / 2;
    const s = Math.sin(halfAngle);

    return this.set(x * s, y * s, z * s, Math.cos(halfAngle));
  }

  fromAttribute(attribute: Attribute, index: number): this {
    return this.set(attribute.getX(index), attribute.getY(index), attribute.getZ(index), attribute.getW(index));
  }

  intoAttribute(attribute: Attribute, index: number): Attribute {
    return attribute.setXYZW(index, this.x, this.y, this.z, this.w);
  }

  asIdentity(): this {
    return this.set(0, 0, 0, 1);
  }

  slerp(to: Const<Quaternion>, step: number): this {
    if (step === 0) return this;
    if (step === 1) return this.from(to);

    const x = this.x,
      y = this.y,
      z = this.z,
      w = this.w;

    let cosHalfTheta = w * to.w + x * to.x + y * to.y + z * to.z;

    if (cosHalfTheta < 0) {
      this.w = -to.w;
      this.x = -to.x;
      this.y = -to.y;
      this.z = -to.z;

      cosHalfTheta = -cosHalfTheta;
    } else {
      this.from(to);
    }

    if (cosHalfTheta >= 1.0) {
      this.w = w;
      this.x = x;
      this.y = y;
      this.z = z;

      return this;
    }

    const sqrSinHalfTheta = 1.0 - cosHalfTheta * cosHalfTheta;

    if (sqrSinHalfTheta <= Number.EPSILON) {
      const s = 1 - step;
      this.w = s * w + step * this.w;
      this.x = s * x + step * this.x;
      this.y = s * y + step * this.y;
      this.z = s * z + step * this.z;

      this.normalize();

      return this;
    }

    const sinHalfTheta = Math.sqrt(sqrSinHalfTheta);
    const halfTheta = Math.atan2(sinHalfTheta, cosHalfTheta);
    const ratioA = Math.sin((1 - step) * halfTheta) / sinHalfTheta,
      ratioB = Math.sin(step * halfTheta) / sinHalfTheta;

    this.w = w * ratioA + this.w * ratioB;
    this.x = x * ratioA + this.x * ratioB;
    this.y = y * ratioA + this.y * ratioB;
    this.z = z * ratioA + this.z * ratioB;

    return this;
  }

  asSlerp(from: Const<Quaternion>, to: Const<Quaternion>, step: number): this {
    return this.from(from).slerp(to, step);
  }

  fromEuler({ x, y, z, order }: Const<Euler>): this {
    x /= 2;
    y /= 2;
    z /= 2;

    const c1 = Math.cos(x);
    const c2 = Math.cos(y);
    const c3 = Math.cos(z);
    const s1 = Math.sin(x);
    const s2 = Math.sin(y);
    const s3 = Math.sin(z);

    switch (order) {
      case 'XYZ':
        return this.set(
          s1 * c2 * c3 + c1 * s2 * s3,
          c1 * s2 * c3 - s1 * c2 * s3,
          c1 * c2 * s3 + s1 * s2 * c3,
          c1 * c2 * c3 - s1 * s2 * s3,
        );
      case 'YXZ':
        return this.set(
          s1 * c2 * c3 + c1 * s2 * s3,
          c1 * s2 * c3 - s1 * c2 * s3,
          c1 * c2 * s3 - s1 * s2 * c3,
          c1 * c2 * c3 + s1 * s2 * s3,
        );
      case 'ZXY':
        return this.set(
          s1 * c2 * c3 - c1 * s2 * s3,
          c1 * s2 * c3 + s1 * c2 * s3,
          c1 * c2 * s3 + s1 * s2 * c3,
          c1 * c2 * c3 - s1 * s2 * s3,
        );
      case 'ZYX':
        return this.set(
          s1 * c2 * c3 - c1 * s2 * s3,
          c1 * s2 * c3 + s1 * c2 * s3,
          c1 * c2 * s3 - s1 * s2 * c3,
          c1 * c2 * c3 + s1 * s2 * s3,
        );
      case 'YZX':
        return this.set(
          s1 * c2 * c3 + c1 * s2 * s3,
          c1 * s2 * c3 + s1 * c2 * s3,
          c1 * c2 * s3 - s1 * s2 * c3,
          c1 * c2 * c3 - s1 * s2 * s3,
        );
      case 'XZY':
        return this.set(
          s1 * c2 * c3 - c1 * s2 * s3,
          c1 * s2 * c3 - s1 * c2 * s3,
          c1 * c2 * s3 + s1 * s2 * c3,
          c1 * c2 * c3 + s1 * s2 * s3,
        );
    }
  }

  fromUnit(from: Const<Vec3>, to: Const<Vec3>): this {
    let r = from.dot(to) + 1;

    if (r < Number.EPSILON) {
      r = 0;

      if (Math.abs(from.x) > Math.abs(from.z)) {
        this.set(-from.y, from.x, 0, r);
      } else {
        this.set(0, -from.z, from.y, r);
      }
    } else {
      this.set(from.y * to.z - from.z * to.y, from.z * to.x - from.x * to.z, from.x * to.y - from.y * to.x, r);
    }

    return this.normalize();
  }

  equals(other: Const<Quaternion>): boolean {
    return this.x === other.x && this.y === other.y && this.z === other.z && this.w === other.w;
  }

  dot(other: Const<Quaternion>): number {
    return this.x * other.x + this.y * other.y + this.z * other.z + this.w * other.w;
  }

  lengthSq(): number {
    return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;
  }

  length(): number {
    return Math.sqrt(this.lengthSq());
  }

  conjugate(): this {
    return this.set(-this.x, -this.y, -this.z, this.w);
  }

  normalize(): this {
    let len = this.length();

    if (len === 0) {
      this.set(0, 0, 0, 1);
    } else if (len !== 1) {
      len = 1 / len;
      this.set(this.x * len, this.y * len, this.z * len, this.w * len);
    }

    return this;
  }

  invert(): this {
    return this.set(-this.x, -this.y, -this.z, this.w);
  }

  angleTo(to: Const<Quaternion>): number {
    return 2 * Math.acos(Math.abs(clamp(this.dot(to), -1, 1)));
  }

  rotateTowards(towards: Const<Quaternion>, step: number): this {
    const angle = this.angleTo(towards);
    if (angle === 0) return this;

    return this.slerp(towards, Math.min(1, step / angle));
  }

  mul({ x, y, z, w }: Const<Quaternion>): this {
    return this.set(
      this.x * w + this.w * x + this.y * z - this.z * y,
      this.y * w + this.w * y + this.z * x - this.x * z,
      this.z * w + this.w * z + this.x * y - this.y * x,
      this.w * w - this.x * x - this.y * y - this.z * z,
    );
  }

  asMul(a: Const<Quaternion>, b: Const<Quaternion>): this {
    const qax = a.x,
      qay = a.y,
      qaz = a.z,
      qaw = a.w;
    const qbx = b.x,
      qby = b.y,
      qbz = b.z,
      qbw = b.w;

    this.x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
    this.y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
    this.z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
    this.w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;

    return this;
  }

  premul({ x, y, z, w }: Const<Quaternion>): this {
    return this.set(
      x * this.w + w * this.x + y * this.z - z * this.y,
      y * this.w + w * this.y + z * this.x - x * this.z,
      z * this.w + w * this.z + x * this.y - y * this.x,
      w * this.w - x * this.x - y * this.y - z * this.z,
    );
  }

  *[Symbol.iterator]() {
    yield this.x;
    yield this.y;
    yield this.z;
    yield this.w;
  }
}

export namespace QuaternionArray {
  export function slerp<T extends NumberArray>(
    dst: T,
    dstOffset: number,
    src0: Const<NumberArray>,
    srcOffset0: number,
    src1: Const<NumberArray>,
    srcOffset1: number,
    t: number,
  ): T {
    let x0 = src0[srcOffset0];
    let y0 = src0[srcOffset0 + 1];
    let z0 = src0[srcOffset0 + 2];
    let w0 = src0[srcOffset0 + 3];

    const x1 = src1[srcOffset1];
    const y1 = src1[srcOffset1 + 1];
    const z1 = src1[srcOffset1 + 2];
    const w1 = src1[srcOffset1 + 3];

    if (t === 0) {
      dst[dstOffset + 0] = x0;
      dst[dstOffset + 1] = y0;
      dst[dstOffset + 2] = z0;
      dst[dstOffset + 3] = w0;
      return dst;
    }

    if (t === 1) {
      dst[dstOffset + 0] = x1;
      dst[dstOffset + 1] = y1;
      dst[dstOffset + 2] = z1;
      dst[dstOffset + 3] = w1;
      return dst;
    }

    if (w0 !== w1 || x0 !== x1 || y0 !== y1 || z0 !== z1) {
      let s = 1 - t;
      const cos = x0 * x1 + y0 * y1 + z0 * z1 + w0 * w1,
        dir = cos >= 0 ? 1 : -1,
        sqrSin = 1 - cos * cos;

      if (sqrSin > Number.EPSILON) {
        const sin = Math.sqrt(sqrSin),
          len = Math.atan2(sin, cos * dir);

        s = Math.sin(s * len) / sin;
        t = Math.sin(t * len) / sin;
      }

      const tDir = t * dir;

      x0 = x0 * s + x1 * tDir;
      y0 = y0 * s + y1 * tDir;
      z0 = z0 * s + z1 * tDir;
      w0 = w0 * s + w1 * tDir;

      if (s === 1 - t) {
        const f = 1 / Math.sqrt(x0 * x0 + y0 * y0 + z0 * z0 + w0 * w0);

        x0 *= f;
        y0 *= f;
        z0 *= f;
        w0 *= f;
      }
    }

    dst[dstOffset] = x0;
    dst[dstOffset + 1] = y0;
    dst[dstOffset + 2] = z0;
    dst[dstOffset + 3] = w0;

    return dst;
  }

  export function multiply<T extends NumberArray>(
    dst: T,
    dstOffset: number,
    src0: Const<NumberArray>,
    srcOffset0: number,
    src1: Const<NumberArray>,
    srcOffset1: number,
  ): T {
    const x0 = src0[srcOffset0];
    const y0 = src0[srcOffset0 + 1];
    const z0 = src0[srcOffset0 + 2];
    const w0 = src0[srcOffset0 + 3];

    const x1 = src1[srcOffset1];
    const y1 = src1[srcOffset1 + 1];
    const z1 = src1[srcOffset1 + 2];
    const w1 = src1[srcOffset1 + 3];

    dst[dstOffset] = x0 * w1 + w0 * x1 + y0 * z1 - z0 * y1;
    dst[dstOffset + 1] = y0 * w1 + w0 * y1 + z0 * x1 - x0 * z1;
    dst[dstOffset + 2] = z0 * w1 + w0 * z1 + x0 * y1 - y0 * x1;
    dst[dstOffset + 3] = w0 * w1 - x0 * x1 - y0 * y1 - z0 * z1;

    return dst;
  }
}

Quaternion.prototype.isQuaternion = true;
