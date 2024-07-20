import * as MathUtils from './MathUtils.js';
import { NumberArray } from './MathUtils.js';
import type { Euler } from './Euler.js';
import { Vec3 } from './Vector3.js';
import type { Matrix4 } from './Matrix4.js';
import type { BufferAttribute } from '../core/BufferAttribute.js';
import type { InterleavedBufferAttribute } from '../core/InterleavedBufferAttribute.js';
import { Const } from './types.ts';

export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

export namespace Quaternion {
  export const create = (x: number, y: number, z: number, w: number): Quaternion => ({ x, y, z, w });
  export const quaternion = create;
  export const is = (value: any): value is Quaternion =>
    typeof value === 'object' &&
    typeof value.x === 'number' &&
    typeof value.y === 'number' &&
    typeof value.z === 'number' &&
    typeof value.w === 'number';

  export const identity = (): Quaternion => create(0, 0, 0, 1);

  export const set = (self: Quaternion, x: number, y: number, z: number, w: number): Quaternion => {
    self.x = x;
    self.y = y;
    self.z = z;
    self.w = w;

    return self;
  };
  export const fill_ = (into: Quaternion, { w, x, y, z }: Const<Quaternion>): Quaternion => set(into, x, y, z, w);

  export const clone = (from: Const<Quaternion>): Quaternion => clone_(from, identity());
  export const clone_ = (from: Const<Quaternion>, into: Quaternion): Quaternion => fill_(into, from);

  export const fromEuler = (euler: Const<Euler>): Quaternion => fromEuler_(euler, identity());
  export const fromEuler_ = ({ order, x, y, z }: Const<Euler>, into: Quaternion) => {
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
        return set(
          into,
          s1 * c2 * c3 + c1 * s2 * s3,
          c1 * s2 * c3 - s1 * c2 * s3,
          c1 * c2 * s3 + s1 * s2 * c3,
          c1 * c2 * c3 - s1 * s2 * s3,
        );
      case 'YXZ':
        return set(
          into,
          s1 * c2 * c3 + c1 * s2 * s3,
          c1 * s2 * c3 - s1 * c2 * s3,
          c1 * c2 * s3 - s1 * s2 * c3,
          c1 * c2 * c3 + s1 * s2 * s3,
        );
      case 'ZXY':
        return set(
          into,
          s1 * c2 * c3 - c1 * s2 * s3,
          c1 * s2 * c3 + s1 * c2 * s3,
          c1 * c2 * s3 + s1 * s2 * c3,
          c1 * c2 * c3 - s1 * s2 * s3,
        );
      case 'ZYX':
        return set(
          into,
          s1 * c2 * c3 - c1 * s2 * s3,
          c1 * s2 * c3 + s1 * c2 * s3,
          c1 * c2 * s3 - s1 * s2 * c3,
          c1 * c2 * c3 + s1 * s2 * s3,
        );
      case 'YZX':
        return set(
          into,
          s1 * c2 * c3 + c1 * s2 * s3,
          c1 * s2 * c3 + s1 * c2 * s3,
          c1 * c2 * s3 - s1 * s2 * c3,
          c1 * c2 * c3 - s1 * s2 * s3,
        );
      case 'XZY':
        return set(
          into,
          s1 * c2 * c3 - c1 * s2 * s3,
          c1 * s2 * c3 - s1 * c2 * s3,
          c1 * c2 * s3 + s1 * s2 * c3,
          c1 * c2 * c3 + s1 * s2 * s3,
        );
    }
  };
  export const fillEuler = (self: Quaternion, euler: Const<Euler>): Quaternion => fromEuler_(euler, self);

  export const fromUnit = (from: Const<Vec3>, to: Const<Vec3>): Quaternion => fromUnit_(from, to, identity());
  export const fromUnit_ = (from: Const<Vec3>, to: Const<Vec3>, into: Quaternion): Quaternion => {
    let r = Vec3.dot(from, to) + 1;

    if (r < Number.EPSILON) {
      r = 0;

      if (Math.abs(from.x) > Math.abs(from.z)) {
        set(into, -from.y, from.x, 0, r);
      } else {
        set(into, 0, -from.z, from.y, r);
      }
    } else {
      set(into, from.y * to.z - from.z * to.y, from.z * to.x - from.x * to.z, from.x * to.y - from.y * to.x, r);
    }

    return normalize(into);
  };
  export const fillUnit = (self: Quaternion, from: Const<Vec3>, to: Const<Vec3>): Quaternion =>
    fromUnit_(from, to, self);

  export const fromArray = (array: Const<NumberArray>, offset: number): Quaternion =>
    fromArray_(array, offset, identity());
  export const fromArray_ = (array: Const<NumberArray>, offset: number, into: Quaternion): Quaternion =>
    set(into, array[offset], array[offset + 1], array[offset + 2], array[offset + 3]);
  export const fillArray = (self: Quaternion, array: Const<NumberArray>, offset: number): Quaternion =>
    fromArray_(array, offset, self);
  export const intoArray_ = <T extends NumberArray>({ x, y, z, w }: Const<Quaternion>, offset: number, into: T): T => {
    into[offset] = x;
    into[offset + 1] = y;
    into[offset + 2] = z;
    into[offset + 3] = w;

    return into;
  };
  export const intoArray = (self: Const<Quaternion>): number[] => intoArray_(self, 0, [0, 0, 0, 0]);

  export const fromRotation = (matrix: Const<Matrix4>): Quaternion => fromRotation_(matrix, identity());
  export const fromRotation_ = (matrix: Const<Matrix4>, into: Quaternion): Quaternion => {
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

      return set(into, (m32 - m23) * s, (m13 - m31) * s, (m21 - m12) * s, 0.25 / s);
    }

    if (m11 > m22 && m11 > m33) {
      const s = 2.0 * Math.sqrt(1.0 + m11 - m22 - m33);

      into.x = 0.25 * s;
      into.y = (m12 + m21) / s;
      into.z = (m13 + m31) / s;
      into.w = (m32 - m23) / s;
      return set(into, 0.25 * s, (m12 + m21) / s, (m13 + m31) / s, (m32 - m23) / s);
    }

    if (m22 > m33) {
      const s = 2.0 * Math.sqrt(1.0 + m22 - m11 - m33);
      return set(into, (m12 + m21) / s, 0.25 * s, (m23 + m32) / s, (m13 - m31) / s);
    }

    const s = 2.0 * Math.sqrt(1.0 + m33 - m11 - m22);
    return set(into, (m13 + m31) / s, (m23 + m32) / s, 0.25 * s, (m21 - m12) / s);
  };
  export const fillRotation = (self: Quaternion, matrix: Const<Matrix4>): Quaternion => fromRotation_(matrix, self);

  export const fromAxisAngle = (axis: Const<Vec3>, angle: number): Quaternion =>
    fromAxisAngle_(axis, angle, identity());
  export const fromAxisAngle_ = (axis: Const<Vec3>, angle: number, into: Quaternion): Quaternion => {
    const halfAngle = angle / 2;
    const s = Math.sin(halfAngle);

    return set(into, axis.x * s, axis.y * s, axis.z * s, Math.cos(halfAngle));
  };
  export const fillAxisAngle = (self: Quaternion, axis: Const<Vec3>, angle: number): Quaternion =>
    fromAxisAngle_(axis, angle, self);

  export const fromAttribute = (attribute: Const<BufferAttribute | InterleavedBufferAttribute>, index: number) =>
    fromAttribute_(attribute, index, identity());
  export const fromAttribute_ = (
    attribute: Const<BufferAttribute | InterleavedBufferAttribute>,
    index: number,
    into: Quaternion,
  ): Quaternion =>
    set(into, attribute.getX(index), attribute.getY(index), attribute.getZ(index), attribute.getW(index));
  export const fillAttribute = (
    self: Quaternion,
    attribute: Const<BufferAttribute | InterleavedBufferAttribute>,
    index: number,
  ): Quaternion => fromAttribute_(attribute, index, self);
  export const intoAttribute_ = (
    { x, y, z, w }: Const<Quaternion>,
    attribute: BufferAttribute | InterleavedBufferAttribute,
    index: number,
  ) => {
    attribute.setXYZW(index, x, y, z, w);

    return attribute;
  };

  export const equals = (a: Const<Quaternion>, b: Const<Quaternion>): boolean =>
    b.x === a.x && b.y === a.y && b.z === a.z && b.w === a.w;

  export const dot = (a: Const<Quaternion>, b: Const<Quaternion>): number =>
    a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;

  export const lengthSq = ({ x, y, z, w }: Const<Quaternion>): number => x * x + y * y + z * z + w * w;
  export const length = (self: Const<Quaternion>): number => Math.sqrt(lengthSq(self));

  export const conjugate = (self: Quaternion): Quaternion => conjugate_(self, self);
  export const conjugate_ = ({ x, y, z, w }: Const<Quaternion>, into: Quaternion): Quaternion => {
    into.x = -x;
    into.y = -y;
    into.z = -z;
    into.w = w;

    return into;
  };
  export const conjugated = (self: Const<Quaternion>): Quaternion => conjugate_(self, identity());

  export const normalize = (self: Quaternion): Quaternion => normalize_(self, self);
  export const normalize_ = (self: Const<Quaternion>, into: Quaternion): Quaternion => {
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
  export const normalized = (self: Const<Quaternion>): Quaternion => normalize_(self, identity());

  export const invert = (self: Quaternion): Quaternion => invert_(self, self);
  export const invert_ = (self: Const<Quaternion>, into: Quaternion): Quaternion => {
    const { x, y, z, w } = self;
    const len = 1 / lengthSq(self);
    if (len === 0) return set(into, 0, 0, 0, 1);
    return set(into, -x * len, -y * len, -z * len, w * len);
  };
  export const inverted = (self: Const<Quaternion>): Quaternion => invert_(self, clone(self));

  export const angleTo = (a: Const<Quaternion>, b: Const<Quaternion>): number =>
    2 * Math.acos(Math.abs(MathUtils.clamp(dot(a, b), -1, 1)));

  export const rotateTowards = (self: Quaternion, target: Const<Quaternion>, step: number): Quaternion =>
    rotateTowards_(self, target, step, self);
  export const rotateTowards_ = (
    self: Const<Quaternion>,
    target: Const<Quaternion>,
    step: number,
    into: Quaternion,
  ): Quaternion => {
    const angle = angleTo(self, target);

    if (angle === 0) return clone_(self, into);

    const t = Math.min(1, step / angle);

    return slerp_(self, target, t, into);
  };
  export const rotatedTowards = (self: Const<Quaternion>, target: Const<Quaternion>, step: number): Quaternion =>
    rotateTowards_(self, target, step, identity());

  export const multiply = (self: Quaternion, other: Const<Quaternion>): Quaternion => multiply_(self, other, self);

  export const multiply_ = (
    { x: ax, y: ay, z: az, w: aw }: Const<Quaternion>,
    { x: bx, y: by, z: bz, w: bw }: Const<Quaternion>,
    into: Quaternion,
  ): Quaternion => {
    into.x = ax * bw + aw * bx + ay * bz - az * by;
    into.y = ay * bw + aw * by + az * bx - ax * bz;
    into.z = az * bw + aw * bz + ax * by - ay * bx;
    into.w = aw * bw - ax * bx - ay * by - az * bz;

    return into;
  };
  export const multiplied = (a: Const<Quaternion>, b: Const<Quaternion>): Quaternion => multiply_(a, b, identity());

  export const premultiply = (self: Quaternion, other: Const<Quaternion>): Quaternion => multiply_(other, self, self);
  export const premultiply_ = (self: Const<Quaternion>, other: Const<Quaternion>, into: Quaternion) =>
    multiply_(other, self, into);
  export const premultiplied = (self: Const<Quaternion>, other: Const<Quaternion>): Quaternion =>
    multiply_(other, self, identity());

  export const slerp = (self: Quaternion, other: Const<Quaternion>, t: number): Quaternion =>
    slerp_(self, other, t, self);
  export const slerp_ = (
    self: Const<Quaternion>,
    other: Const<Quaternion>,
    t: number,
    into: Quaternion,
  ): Quaternion => {
    if (t === 0) return clone_(self, into);
    if (t === 1) return clone_(other, into);

    const { x: ax, y: ay, z: az, w: aw } = self;
    const { x: bx, y: by, z: bz, w: bw } = other;

    let cosHalfTheta = aw * bw + ax * bx + ay * by + az * bz;
    if (cosHalfTheta < 0) {
      set(into, -bx, -by, -bz, -bw);
      cosHalfTheta = -cosHalfTheta;
    } else {
      clone_(other, into);
    }

    if (cosHalfTheta >= 1) {
      return clone_(self, into);
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
  export const slerped = (a: Const<Quaternion>, b: Const<Quaternion>, t: number): Quaternion =>
    slerp_(a, b, t, identity());
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
