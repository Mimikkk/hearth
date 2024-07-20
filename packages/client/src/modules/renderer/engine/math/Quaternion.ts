import * as MathUtils from './MathUtils.js';
import { NumberArray } from './MathUtils.js';
import type { Euler } from './Euler.js';
import { Vec3, Vector3 } from './Vector3.js';
import type { Matrix4 } from './Matrix4.js';
import type { BufferAttribute } from '../core/BufferAttribute.js';
import type { InterleavedBufferAttribute } from '../core/InterleavedBufferAttribute.js';

export class Quaternion {
  declare ['constructor']: typeof Quaternion;
  x: number;
  y: number;
  z: number;
  w: number;

  constructor(x: number = 0, y: number = 0, z: number = 0, w: number = 1) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
  }

  set(x: number, y: number, z: number, w: number): this {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;

    return this;
  }

  clone(): Quaternion {
    return new this.constructor(this.x, this.y, this.z, this.w);
  }

  copy(quaternion: Quaternion): this {
    this.x = quaternion.x;
    this.y = quaternion.y;
    this.z = quaternion.z;
    this.w = quaternion.w;

    return this;
  }

  setFromEuler(euler: Euler): this {
    const x = euler.x;
    const y = euler.y;
    const z = euler.z;
    const order = euler.order;

    const c1 = Math.cos(x / 2);
    const c2 = Math.cos(y / 2);
    const c3 = Math.cos(z / 2);

    const s1 = Math.sin(x / 2);
    const s2 = Math.sin(y / 2);
    const s3 = Math.sin(z / 2);

    switch (order) {
      case 'XYZ':
        this.x = s1 * c2 * c3 + c1 * s2 * s3;
        this.y = c1 * s2 * c3 - s1 * c2 * s3;
        this.z = c1 * c2 * s3 + s1 * s2 * c3;
        this.w = c1 * c2 * c3 - s1 * s2 * s3;
        break;

      case 'YXZ':
        this.x = s1 * c2 * c3 + c1 * s2 * s3;
        this.y = c1 * s2 * c3 - s1 * c2 * s3;
        this.z = c1 * c2 * s3 - s1 * s2 * c3;
        this.w = c1 * c2 * c3 + s1 * s2 * s3;
        break;

      case 'ZXY':
        this.x = s1 * c2 * c3 - c1 * s2 * s3;
        this.y = c1 * s2 * c3 + s1 * c2 * s3;
        this.z = c1 * c2 * s3 + s1 * s2 * c3;
        this.w = c1 * c2 * c3 - s1 * s2 * s3;
        break;

      case 'ZYX':
        this.x = s1 * c2 * c3 - c1 * s2 * s3;
        this.y = c1 * s2 * c3 + s1 * c2 * s3;
        this.z = c1 * c2 * s3 - s1 * s2 * c3;
        this.w = c1 * c2 * c3 + s1 * s2 * s3;
        break;

      case 'YZX':
        this.x = s1 * c2 * c3 + c1 * s2 * s3;
        this.y = c1 * s2 * c3 + s1 * c2 * s3;
        this.z = c1 * c2 * s3 - s1 * s2 * c3;
        this.w = c1 * c2 * c3 - s1 * s2 * s3;
        break;

      case 'XZY':
        this.x = s1 * c2 * c3 - c1 * s2 * s3;
        this.y = c1 * s2 * c3 - s1 * c2 * s3;
        this.z = c1 * c2 * s3 + s1 * s2 * c3;
        this.w = c1 * c2 * c3 + s1 * s2 * s3;
        break;

      default:
        console.warn('engine.Quaternion: .setFromEuler() encountered an unknown order: ' + order);
    }

    return this;
  }

  setFromAxisAngle(axis: Vector3, angle: number): this {
    // http://www.euclideanspace.com/maths/geometry/rotations/conversions/angleToQuaternion/index.htm

    // assumes axis is normalized

    const halfAngle = angle / 2,
      s = Math.sin(halfAngle);

    this.x = axis.x * s;
    this.y = axis.y * s;
    this.z = axis.z * s;
    this.w = Math.cos(halfAngle);

    return this;
  }

  setFromRotationMatrix(m: Matrix4): this {
    const te = m.elements,
      m11 = te[0],
      m12 = te[4],
      m13 = te[8],
      m21 = te[1],
      m22 = te[5],
      m23 = te[9],
      m31 = te[2],
      m32 = te[6],
      m33 = te[10],
      trace = m11 + m22 + m33;

    if (trace > 0) {
      const s = 0.5 / Math.sqrt(trace + 1.0);

      this.w = 0.25 / s;
      this.x = (m32 - m23) * s;
      this.y = (m13 - m31) * s;
      this.z = (m21 - m12) * s;
    } else if (m11 > m22 && m11 > m33) {
      const s = 2.0 * Math.sqrt(1.0 + m11 - m22 - m33);

      this.w = (m32 - m23) / s;
      this.x = 0.25 * s;
      this.y = (m12 + m21) / s;
      this.z = (m13 + m31) / s;
    } else if (m22 > m33) {
      const s = 2.0 * Math.sqrt(1.0 + m22 - m11 - m33);

      this.w = (m13 - m31) / s;
      this.x = (m12 + m21) / s;
      this.y = 0.25 * s;
      this.z = (m23 + m32) / s;
    } else {
      const s = 2.0 * Math.sqrt(1.0 + m33 - m11 - m22);

      this.w = (m21 - m12) / s;
      this.x = (m13 + m31) / s;
      this.y = (m23 + m32) / s;
      this.z = 0.25 * s;
    }

    return this;
  }

  setFromUnitVectors(vFrom: Vector3, vTo: Vector3): this {
    // assumes direction vectors vFrom and vTo are normalized

    let r = vFrom.dot(vTo) + 1;

    if (r < Number.EPSILON) {
      // vFrom and vTo point in opposite directions

      r = 0;

      if (Math.abs(vFrom.x) > Math.abs(vFrom.z)) {
        this.x = -vFrom.y;
        this.y = vFrom.x;
        this.z = 0;
        this.w = r;
      } else {
        this.x = 0;
        this.y = -vFrom.z;
        this.z = vFrom.y;
        this.w = r;
      }
    } else {
      // crossVectors( vFrom, vTo ); // inlined to avoid cyclic dependency on Vector3

      this.x = vFrom.y * vTo.z - vFrom.z * vTo.y;
      this.y = vFrom.z * vTo.x - vFrom.x * vTo.z;
      this.z = vFrom.x * vTo.y - vFrom.y * vTo.x;
      this.w = r;
    }

    return this.normalize();
  }

  angleTo(q: Quaternion): number {
    return 2 * Math.acos(Math.abs(MathUtils.clamp(this.dot(q), -1, 1)));
  }

  rotateTowards(q: Quaternion, step: number): this {
    const angle = this.angleTo(q);

    if (angle === 0) return this;

    const t = Math.min(1, step / angle);

    this.slerp(q, t);

    return this;
  }

  identity(): this {
    return this.set(0, 0, 0, 1);
  }

  invert(): this {
    // quaternion is assumed to have unit length

    return this.conjugate();
  }

  conjugate(): this {
    this.x *= -1;
    this.y *= -1;
    this.z *= -1;

    return this;
  }

  dot(v: Quaternion): number {
    return this.x * v.x + this.y * v.y + this.z * v.z + this.w * v.w;
  }

  lengthSq(): number {
    return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;
  }

  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
  }

  normalize(): this {
    let l = this.length();

    if (l === 0) {
      this.x = 0;
      this.y = 0;
      this.z = 0;
      this.w = 1;
    } else {
      l = 1 / l;

      this.x = this.x * l;
      this.y = this.y * l;
      this.z = this.z * l;
      this.w = this.w * l;
    }

    return this;
  }

  multiply(q: Quaternion): this {
    return this.multiplyQuaternions(this, q);
  }

  premultiply(q: Quaternion): this {
    return this.multiplyQuaternions(q, this);
  }

  multiplyQuaternions(a: Quaternion, b: Quaternion): this {
    // from http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/code/index.htm

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

  slerp(qb: Quaternion, t: number): this {
    if (t === 0) return this;
    if (t === 1) return this.copy(qb);

    const x = this.x,
      y = this.y,
      z = this.z,
      w = this.w;

    // http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/slerp/

    let cosHalfTheta = w * qb.w + x * qb.x + y * qb.y + z * qb.z;

    if (cosHalfTheta < 0) {
      this.w = -qb.w;
      this.x = -qb.x;
      this.y = -qb.y;
      this.z = -qb.z;

      cosHalfTheta = -cosHalfTheta;
    } else {
      this.copy(qb);
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
      const s = 1 - t;
      this.w = s * w + t * this.w;
      this.x = s * x + t * this.x;
      this.y = s * y + t * this.y;
      this.z = s * z + t * this.z;

      this.normalize();

      return this;
    }

    const sinHalfTheta = Math.sqrt(sqrSinHalfTheta);
    const halfTheta = Math.atan2(sinHalfTheta, cosHalfTheta);
    const ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta,
      ratioB = Math.sin(t * halfTheta) / sinHalfTheta;

    this.w = w * ratioA + this.w * ratioB;
    this.x = x * ratioA + this.x * ratioB;
    this.y = y * ratioA + this.y * ratioB;
    this.z = z * ratioA + this.z * ratioB;

    return this;
  }

  random(): this {
    // sets this quaternion to a uniform random unit quaternnion

    // Ken Shoemake
    // Uniform random rotations
    // D. Kirk, editor, Graphics Gems III, pages 124-132. Academic Press, New York, 1992.

    const theta1 = 2 * Math.PI * Math.random();
    const theta2 = 2 * Math.PI * Math.random();

    const x0 = Math.random();
    const r1 = Math.sqrt(1 - x0);
    const r2 = Math.sqrt(x0);

    return this.set(r1 * Math.sin(theta1), r1 * Math.cos(theta1), r2 * Math.sin(theta2), r2 * Math.cos(theta2));
  }

  equals(quaternion: Quaternion): boolean {
    return quaternion.x === this.x && quaternion.y === this.y && quaternion.z === this.z && quaternion.w === this.w;
  }

  fromArray(array: number[], offset: number = 0): this {
    this.x = array[offset];
    this.y = array[offset + 1];
    this.z = array[offset + 2];
    this.w = array[offset + 3];

    return this;
  }

  toArray(array: number[] = [], offset: number = 0): number[] {
    array[offset] = this.x;
    array[offset + 1] = this.y;
    array[offset + 2] = this.z;
    array[offset + 3] = this.w;

    return array;
  }

  fromBufferAttribute(attribute: BufferAttribute<any> | InterleavedBufferAttribute, index: number): this {
    this.x = attribute.getX(index);
    this.y = attribute.getY(index);
    this.z = attribute.getZ(index);
    this.w = attribute.getW(index);

    return this;
  }

  *[Symbol.iterator]() {
    yield this.x;
    yield this.y;
    yield this.z;
    yield this.w;
  }
}

export interface Quaternion_ {
  x: number;
  y: number;
  z: number;
  w: number;
}

export namespace Quaternion_ {
  export const create = (x: number, y: number, z: number, w: number): Quaternion_ => ({ x, y, z, w });
  export const quaternion = create;

  export const identity = (): Quaternion_ => create(0, 0, 0, 1);

  export const fromEuler = (euler: Readonly<Euler>): Quaternion_ => fromEuler_(euler, identity());
  export const fromEuler_ = ({ order, x, y, z }: Readonly<Euler>, into: Quaternion_) => {
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
        return fill(
          into,
          s1 * c2 * c3 + c1 * s2 * s3,
          c1 * s2 * c3 - s1 * c2 * s3,
          c1 * c2 * s3 + s1 * s2 * c3,
          c1 * c2 * c3 - s1 * s2 * s3,
        );
      case 'YXZ':
        return fill(
          into,
          s1 * c2 * c3 + c1 * s2 * s3,
          c1 * s2 * c3 - s1 * c2 * s3,
          c1 * c2 * s3 - s1 * s2 * c3,
          c1 * c2 * c3 + s1 * s2 * s3,
        );
      case 'ZXY':
        return fill(
          into,
          s1 * c2 * c3 - c1 * s2 * s3,
          c1 * s2 * c3 + s1 * c2 * s3,
          c1 * c2 * s3 + s1 * s2 * c3,
          c1 * c2 * c3 - s1 * s2 * s3,
        );
      case 'ZYX':
        return fill(
          into,
          s1 * c2 * c3 - c1 * s2 * s3,
          c1 * s2 * c3 + s1 * c2 * s3,
          c1 * c2 * s3 - s1 * s2 * c3,
          c1 * c2 * c3 + s1 * s2 * s3,
        );
      case 'YZX':
        return fill(
          into,
          s1 * c2 * c3 + c1 * s2 * s3,
          c1 * s2 * c3 + s1 * c2 * s3,
          c1 * c2 * s3 - s1 * s2 * c3,
          c1 * c2 * c3 - s1 * s2 * s3,
        );
      case 'XZY':
        return fill(
          into,
          s1 * c2 * c3 - c1 * s2 * s3,
          c1 * s2 * c3 - s1 * c2 * s3,
          c1 * c2 * s3 + s1 * s2 * c3,
          c1 * c2 * c3 + s1 * s2 * s3,
        );
    }
  };
  export const fillEuler = (self: Quaternion_, euler: Readonly<Euler>): Quaternion_ => fromEuler_(euler, self);

  export const fromUnit = (from: Readonly<Vec3>, to: Readonly<Vec3>): Quaternion_ => fromUnit_(from, to, identity());
  export const fromUnit_ = (from: Readonly<Vec3>, to: Readonly<Vec3>, into: Quaternion_): Quaternion_ => {
    let r = Vec3.dot(from, to) + 1;

    if (r < Number.EPSILON) {
      r = 0;

      if (Math.abs(from.x) > Math.abs(from.z)) {
        fill(into, -from.y, from.x, 0, r);
      } else {
        fill(into, 0, -from.z, from.y, r);
      }
    } else {
      fill(into, from.y * to.z - from.z * to.y, from.z * to.x - from.x * to.z, from.x * to.y - from.y * to.x, r);
    }

    return normalize(into);
  };
  export const fillUnit = (self: Quaternion_, from: Readonly<Vec3>, to: Readonly<Vec3>): Quaternion_ =>
    fromUnit_(from, to, self);

  export const fromArray = (array: Readonly<NumberArray>, offset: number): Quaternion_ =>
    fromArray_(array, offset, identity());
  export const fromArray_ = (array: Readonly<NumberArray>, offset: number, into: Quaternion_): Quaternion_ =>
    fill(into, array[offset], array[offset + 1], array[offset + 2], array[offset + 3]);
  export const fillArray = (self: Quaternion_, array: Readonly<NumberArray>, offset: number): Quaternion_ =>
    fromArray_(array, offset, self);
  export const intoArray_ = <T extends NumberArray>(
    { x, y, z, w }: Readonly<Quaternion_>,
    offset: number,
    into: T,
  ): T => {
    into[offset] = x;
    into[offset + 1] = y;
    into[offset + 2] = z;
    into[offset + 3] = w;

    return into;
  };
  export const intoArray = (self: Readonly<Quaternion_>): number[] => intoArray_(self, 0, [0, 0, 0, 0]);

  export const fromRotation = (matrix: Readonly<Matrix4>): Quaternion_ => fromRotation_(matrix, identity());
  export const fromRotation_ = (matrix: Readonly<Matrix4>, into: Quaternion_): Quaternion_ => {
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
    const trace = m11 + m22 + m33;

    if (trace > 0) {
      const s = 0.5 / Math.sqrt(trace + 1.0);

      return fill(into, (m32 - m23) * s, (m13 - m31) * s, (m21 - m12) * s, 0.25 / s);
    }

    if (m11 > m22 && m11 > m33) {
      const s = 2.0 * Math.sqrt(1.0 + m11 - m22 - m33);

      into.x = 0.25 * s;
      into.y = (m12 + m21) / s;
      into.z = (m13 + m31) / s;
      into.w = (m32 - m23) / s;
      return fill(into, 0.25 * s, (m12 + m21) / s, (m13 + m31) / s, (m32 - m23) / s);
    }

    if (m22 > m33) {
      const s = 2.0 * Math.sqrt(1.0 + m22 - m11 - m33);
      return fill(into, (m12 + m21) / s, 0.25 * s, (m23 + m32) / s, (m13 - m31) / s);
    }

    const s = 2.0 * Math.sqrt(1.0 + m33 - m11 - m22);
    return fill(into, (m13 + m31) / s, (m23 + m32) / s, 0.25 * s, (m21 - m12) / s);
  };
  export const fillRotation = (self: Quaternion_, matrix: Readonly<Matrix4>): Quaternion_ =>
    fromRotation_(matrix, self);

  export const fromAxisAngle = (axis: Readonly<Vec3>, angle: number): Quaternion_ =>
    fromAxisAngle_(axis, angle, identity());
  export const fromAxisAngle_ = (axis: Readonly<Vec3>, angle: number, into: Quaternion_): Quaternion_ => {
    const halfAngle = angle / 2;
    const s = Math.sin(halfAngle);

    return fill(into, axis.x * s, axis.y * s, axis.z * s, Math.cos(halfAngle));
  };
  export const fillAxisAngle = (self: Quaternion_, axis: Readonly<Vec3>, angle: number): Quaternion_ =>
    fromAxisAngle_(axis, angle, self);

  export const fromAttribute = (attribute: Readonly<BufferAttribute | InterleavedBufferAttribute>, index: number) =>
    fromAttribute_(attribute, index, identity());
  export const fromAttribute_ = (
    attribute: Readonly<BufferAttribute | InterleavedBufferAttribute>,
    index: number,
    into: Quaternion_,
  ): Quaternion_ =>
    fill(into, attribute.getX(index), attribute.getY(index), attribute.getZ(index), attribute.getW(index));
  export const fillAttribute = (
    self: Quaternion_,
    attribute: Readonly<BufferAttribute | InterleavedBufferAttribute>,
    index: number,
  ): Quaternion_ => fromAttribute_(attribute, index, self);
  export const intoAttribute_ = (
    { x, y, z, w }: Readonly<Quaternion_>,
    attribute: BufferAttribute | InterleavedBufferAttribute,
    index: number,
  ) => {
    attribute.setXYZW(index, x, y, z, w);

    return attribute;
  };

  export const copy = ({ x, y, z, w }: Readonly<Quaternion_>): Quaternion_ => create(x, y, z, w);
  export const fill = (self: Quaternion_, x: number, y: number, z: number, w: number): Quaternion_ => {
    self.x = x;
    self.y = y;
    self.z = z;
    self.w = w;

    return self;
  };
  export const fill_ = ({ w, x, y, z }: Readonly<Quaternion_>, into: Quaternion_): Quaternion_ => {
    into.x = x;
    into.y = y;
    into.z = z;
    into.w = w;

    return into;
  };

  export const equals = (a: Readonly<Quaternion_>, b: Readonly<Quaternion_>): boolean =>
    b.x === a.x && b.y === a.y && b.z === a.z && b.w === a.w;

  export const dot = (a: Readonly<Quaternion_>, b: Readonly<Quaternion_>): number =>
    a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;

  export const lengthSq = ({ x, y, z, w }: Readonly<Quaternion_>): number => x * x + y * y + z * z + w * w;
  export const length = (self: Readonly<Quaternion_>): number => Math.sqrt(lengthSq(self));

  export const conjugate = (self: Quaternion_): Quaternion_ => conjugate_(self, self);
  export const conjugate_ = ({ x, y, z, w }: Readonly<Quaternion_>, into: Quaternion_): Quaternion_ => {
    into.x = -x;
    into.y = -y;
    into.z = -z;
    into.w = w;

    return into;
  };
  export const conjugated = (self: Readonly<Quaternion_>): Quaternion_ => conjugate_(self, identity());

  export const normalize = (self: Quaternion_): Quaternion_ => normalize_(self, self);
  export const normalize_ = (self: Readonly<Quaternion_>, into: Quaternion_): Quaternion_ => {
    let len = length(self);

    if (len === 0) {
      into.x = 0;
      into.y = 0;
      into.z = 0;
      into.w = 1;
    } else if (len !== 1) {
      len = 1 / len;
      into.x = self.x * len;
      into.y = self.y * len;
      into.z = self.z * len;
      into.w = self.w * len;
    }

    return into;
  };
  export const normalized = (self: Readonly<Quaternion_>): Quaternion_ => normalize_(self, identity());

  export const invert = (self: Quaternion_): Quaternion_ => invert_(self, self);
  export const invert_ = (self: Readonly<Quaternion_>, into: Quaternion_): Quaternion_ => {
    const { x, y, z, w } = self;
    const len = 1 / lengthSq(self);
    if (len === 0) return fill(into, 0, 0, 0, 1);
    return fill(into, -x * len, -y * len, -z * len, w * len);
  };
  export const inverted = (self: Readonly<Quaternion_>): Quaternion_ => invert_(self, copy(self));

  export const angleTo = (a: Readonly<Quaternion_>, b: Readonly<Quaternion_>): number =>
    2 * Math.acos(Math.abs(MathUtils.clamp(dot(a, b), -1, 1)));

  export const rotateTowards = (self: Quaternion_, target: Readonly<Quaternion_>, step: number): Quaternion_ =>
    rotateTowards_(self, target, step, self);
  export const rotateTowards_ = (
    self: Readonly<Quaternion_>,
    target: Readonly<Quaternion_>,
    step: number,
    into: Quaternion_,
  ): Quaternion_ => {
    const angle = angleTo(self, target);

    if (angle === 0) return fill_(self, into);

    const t = Math.min(1, step / angle);

    return slerp_(self, target, t, into);
  };
  export const rotatedTowards = (
    self: Readonly<Quaternion_>,
    target: Readonly<Quaternion_>,
    step: number,
  ): Quaternion_ => rotateTowards_(self, target, step, identity());

  export const multiply = (self: Quaternion_, other: Readonly<Quaternion_>): Quaternion_ =>
    multiply_(self, other, self);

  export const multiply_ = (
    { x: ax, y: ay, z: az, w: aw }: Readonly<Quaternion_>,
    { x: bx, y: by, z: bz, w: bw }: Readonly<Quaternion_>,
    into: Quaternion_,
  ): Quaternion_ => {
    into.x = ax * bw + aw * bx + ay * bz - az * by;
    into.y = ay * bw + aw * by + az * bx - ax * bz;
    into.z = az * bw + aw * bz + ax * by - ay * bx;
    into.w = aw * bw - ax * bx - ay * by - az * bz;

    return into;
  };
  export const multiplied = (a: Readonly<Quaternion_>, b: Readonly<Quaternion_>): Quaternion_ =>
    multiply_(a, b, identity());

  export const premultiply = (self: Quaternion_, other: Readonly<Quaternion_>): Quaternion_ =>
    multiply_(other, self, self);
  export const premultiply_ = (self: Readonly<Quaternion_>, other: Readonly<Quaternion_>, into: Quaternion_) =>
    multiply_(other, self, into);
  export const premultiplied = (self: Readonly<Quaternion_>, other: Readonly<Quaternion_>): Quaternion_ =>
    multiply_(other, self, identity());

  export const slerp = (self: Quaternion_, other: Readonly<Quaternion_>, t: number): Quaternion_ =>
    slerp_(self, other, t, self);
  export const slerp_ = (
    self: Readonly<Quaternion_>,
    other: Readonly<Quaternion_>,
    t: number,
    into: Quaternion_,
  ): Quaternion_ => {
    if (t === 0) return fill_(self, into);
    if (t === 1) return fill_(other, into);

    const { x: ax, y: ay, z: az, w: aw } = self;
    const { x: bx, y: by, z: bz, w: bw } = other;

    let cosHalfTheta = aw * bw + ax * bx + ay * by + az * bz;
    if (cosHalfTheta < 0) {
      fill(into, -bx, -by, -bz, -bw);
      cosHalfTheta = -cosHalfTheta;
    } else {
      fill_(other, into);
    }

    if (cosHalfTheta >= 1) {
      return fill_(self, into);
    }

    const sqrSinHalfTheta = 1 - cosHalfTheta * cosHalfTheta;

    if (sqrSinHalfTheta <= Number.EPSILON) {
      const s = 1 - t;
      into.x = s * ax + t * into.x;
      into.y = s * ay + t * into.y;
      into.z = s * az + t * into.z;
      into.w = s * aw + t * into.w;

      return normalize(into);
    }

    const sinHalfTheta = Math.sqrt(sqrSinHalfTheta);
    const halfTheta = Math.atan2(sinHalfTheta, cosHalfTheta);

    const ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta;
    const ratioB = Math.sin(t * halfTheta) / sinHalfTheta;

    into.x = ax * ratioA + into.x * ratioB;
    into.y = ay * ratioA + into.y * ratioB;
    into.z = az * ratioA + into.z * ratioB;
    into.w = aw * ratioA + into.w * ratioB;

    return into;
  };
  export const slerped = (a: Readonly<Quaternion_>, b: Readonly<Quaternion_>, t: number): Quaternion_ =>
    slerp_(a, b, t, identity());
}

export namespace QuaternionArray {
  export function slerp<T extends NumberArray>(
    dst: T,
    dstOffset: number,
    src0: Readonly<NumberArray>,
    srcOffset0: number,
    src1: Readonly<NumberArray>,
    srcOffset1: number,
    t: number,
  ): T {
    // fuzz-free, array-based Quaternion SLERP operation

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

      // Skip the Slerp for tiny steps to avoid numeric problems:
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

      // Normalize in case we just did a lerp:
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
    src0: Readonly<NumberArray>,
    srcOffset0: number,
    src1: Readonly<NumberArray>,
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
