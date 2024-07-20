import { Quaternion } from './Quaternion.js';
import { Matrix4 } from './Matrix4.js';
import { clamp } from './MathUtils.js';
import { Vec3 } from '@modules/renderer/engine/math/Vector3.js';
import { Const } from '@modules/renderer/engine/math/types.js';

export interface Euler {
  x: number;
  y: number;
  z: number;
  order: EulerOrder;
}

type Mat4x4 = number[];

const _matrix = /*@__PURE__*/ new Matrix4();
const _quaternion = Quaternion.identity();
export namespace Euler {
  export const create = (x: number, y: number, z: number, order: Order = 'XYZ'): Euler => ({ x, y, z, order });
  export const euler = create;

  export const empty = (): Euler => create(0, 0, 0, 'XYZ');
  export type Order = 'XYZ' | 'YXZ' | 'ZXY' | 'ZYX' | 'YZX' | 'XZY';

  export const copy = ({ x, y, z, order }: Euler): Euler => create(x, y, z, order);
  export const fill = (self: Euler, x: number, y: number, z: number, order: Order): Euler => {
    self.x = x;
    self.y = y;
    self.z = z;
    self.order = order;

    return self;
  };
  export const fill_ = ({ order, x, y, z }: Euler, into: Euler): Euler => {
    into.x = x;
    into.y = y;
    into.z = z;
    into.order = order;

    return into;
  };

  export const fromVec = ({ x, y, z }: Const<Vec3>, order: Order = 'XYZ'): Euler => create(x, y, z, order);
  export const fromVec_ = ({ x, y, z }: Const<Vec3>, into: Euler): Euler => fill(into, x, y, z, into.order);
  export const fillVec = (self: Euler, vec: Const<Vec3>): Euler => {
    self.x = vec.x;
    self.y = vec.y;
    self.z = vec.z;

    return self;
  };

  export const fromMat = (matrix: Const<Mat4x4>, order: Order): Euler => fromMat_(matrix, order, empty());
  export const fromMat_ = (matrix: Const<Mat4x4>, order: Order, into: Euler): Euler => {
    const m11 = matrix[0];
    const m12 = matrix[4];
    const m13 = matrix[8];
    const m21 = matrix[1];
    const m22 = matrix[5];
    const m23 = matrix[9];
    const m31 = matrix[2];
    const m32 = matrix[6];
    const m33 = matrix[10];

    switch (order) {
      case 'XYZ':
        into.y = Math.asin(clamp(m13, -1, 1));
        if (Math.abs(m13) < 0.9999999) {
          into.x = Math.atan2(-m23, m33);
          into.z = Math.atan2(-m12, m11);
        } else {
          into.x = Math.atan2(m32, m22);
          into.z = 0;
        }
        break;
      case 'YXZ':
        into.x = Math.asin(-clamp(m23, -1, 1));
        if (Math.abs(m23) < 0.9999999) {
          into.y = Math.atan2(m13, m33);
          into.z = Math.atan2(m21, m22);
        } else {
          into.y = Math.atan2(-m31, m11);
          into.z = 0;
        }
        break;
      case 'ZXY':
        into.x = Math.asin(clamp(m32, -1, 1));
        if (Math.abs(m32) < 0.9999999) {
          into.y = Math.atan2(-m31, m33);
          into.z = Math.atan2(-m12, m22);
        } else {
          into.y = 0;
          into.z = Math.atan2(m21, m11);
        }
        break;
      case 'ZYX':
        into.y = Math.asin(-clamp(m31, -1, 1));
        if (Math.abs(m31) < 0.9999999) {
          into.x = Math.atan2(m32, m33);
          into.z = Math.atan2(m21, m11);
        } else {
          into.x = 0;
          into.z = Math.atan2(-m12, m22);
        }
        break;
      case 'YZX':
        into.z = Math.asin(clamp(m21, -1, 1));
        if (Math.abs(m21) < 0.9999999) {
          into.x = Math.atan2(-m23, m22);
          into.y = Math.atan2(-m31, m11);
        } else {
          into.x = 0;
          into.y = Math.atan2(m13, m33);
        }
        break;
      case 'XZY':
        into.z = Math.asin(-clamp(m12, -1, 1));
        if (Math.abs(m12) < 0.9999999) {
          into.x = Math.atan2(m32, m22);
          into.y = Math.atan2(m13, m11);
        } else {
          into.x = Math.atan2(-m23, m33);
          into.y = 0;
        }
        break;
    }
    into.order = order;
    return into;
  };
  export const fillMat = (self: Euler, matrix: Const<Mat4x4>): Euler => fromMat_(matrix, self.order, self);

  export const fromQuaternion = (quaternion: Quaternion, order: Order): Euler =>
    fromQuaternion_(quaternion, order, empty());
  export const fromQuaternion_ = (quaternion: Quaternion, order: Order, into: Euler): Euler =>
    fromMat_(_matrix.makeRotationFromQuaternion(quaternion).elements, order, into);
  export const fillQuaternion = (self: Euler, quaternion: Quaternion): Euler =>
    fromQuaternion_(quaternion, self.order, self);

  export const fromArray = (array: Const<(number | string)[]>, offset: number) => fromArray_(array, offset, empty());
  export const fromArray_ = (array: Const<(number | string)[]>, offset: number, into: Euler) =>
    fill(
      into,
      array[offset] as number,
      array[offset + 1] as number,
      array[offset + 2] as number,
      array[offset + 3] as Order,
    );
  export const fillArray = (self: Euler, array: (number | string)[], offset: number) => fromArray_(array, offset, self);
  export const intoArray_ = (
    { x, y, z, order }: Euler,
    array: (number | string)[],
    offset: number,
  ): (number | string)[] => {
    array[offset] = x;
    array[offset + 1] = y;
    array[offset + 2] = z;
    array[offset + 3] = order;

    return array;
  };
  export const intoArray = (self: Euler): (number | string)[] => intoArray_(self, [0, 0, 0, 'XYZ'], 0);

  export const reorder = (self: Euler, order: Order): Euler => reorder_(self, order, self);
  export const reorder_ = (self: Euler, order: Order, into: Euler): Euler =>
    fromQuaternion_(Quaternion.fromEuler_(self, _quaternion), order, into);
  export const reordered = (self: Euler, order: Order): Euler => reorder_(self, order, empty());

  export const equals = (a: Euler, b: Euler): boolean =>
    b.x === a.x && b.y === a.y && b.z === a.z && b.order === a.order;

  export const orders: Order[] = ['XYZ', 'YXZ', 'ZXY', 'ZYX', 'YZX', 'XZY'];
}
export type EulerOrder = Euler.Order;
