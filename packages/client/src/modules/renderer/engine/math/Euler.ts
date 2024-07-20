import { Quaternion, Quaternion_ } from './Quaternion.js';
import { Matrix4 } from './Matrix4.js';
import { clamp } from './MathUtils.js';
import { Vector3 } from '@modules/renderer/engine/math/Vector3.js';

const _matrix = /*@__PURE__*/ new Matrix4();
const _quaternion = /*@__PURE__*/ new Quaternion();

export class Euler {
  declare ['constructor']: typeof Euler;

  x: number;
  y: number;
  z: number;
  order: EulerOrder;

  constructor(x = 0, y = 0, z = 0, order: EulerOrder = 'XYZ') {
    this.x = x;
    this.y = y;
    this.z = z;
    this.order = order;
  }

  set(x: number, y: number, z: number, order: EulerOrder = this.order) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.order = order;

    return this;
  }

  clone(): Euler {
    return new this.constructor(this.x, this.y, this.z, this.order);
  }

  copy(euler: Euler): this {
    this.x = euler.x;
    this.y = euler.y;
    this.z = euler.z;
    this.order = euler.order;

    return this;
  }

  setFromRotationMatrix(m: Matrix4, order: EulerOrder = this.order): this {
    // assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

    const te = m.elements;
    const m11 = te[0];
    const m12 = te[4];
    const m13 = te[8];
    const m21 = te[1];
    const m22 = te[5];
    const m23 = te[9];
    const m31 = te[2];
    const m32 = te[6];
    const m33 = te[10];

    switch (order) {
      case 'XYZ':
        this.y = Math.asin(clamp(m13, -1, 1));

        if (Math.abs(m13) < 0.9999999) {
          this.x = Math.atan2(-m23, m33);
          this.z = Math.atan2(-m12, m11);
        } else {
          this.x = Math.atan2(m32, m22);
          this.z = 0;
        }

        break;
      case 'YXZ':
        this.x = Math.asin(-clamp(m23, -1, 1));

        if (Math.abs(m23) < 0.9999999) {
          this.y = Math.atan2(m13, m33);
          this.z = Math.atan2(m21, m22);
        } else {
          this.y = Math.atan2(-m31, m11);
          this.z = 0;
        }
        break;
      case 'ZXY':
        this.x = Math.asin(clamp(m32, -1, 1));
        if (Math.abs(m32) < 0.9999999) {
          this.y = Math.atan2(-m31, m33);
          this.z = Math.atan2(-m12, m22);
        } else {
          this.y = 0;
          this.z = Math.atan2(m21, m11);
        }
        break;
      case 'ZYX':
        this.y = Math.asin(-clamp(m31, -1, 1));

        if (Math.abs(m31) < 0.9999999) {
          this.x = Math.atan2(m32, m33);
          this.z = Math.atan2(m21, m11);
        } else {
          this.x = 0;
          this.z = Math.atan2(-m12, m22);
        }
        break;
      case 'YZX':
        this.z = Math.asin(clamp(m21, -1, 1));
        if (Math.abs(m21) < 0.9999999) {
          this.x = Math.atan2(-m23, m22);
          this.y = Math.atan2(-m31, m11);
        } else {
          this.x = 0;
          this.y = Math.atan2(m13, m33);
        }
        break;
      case 'XZY':
        this.z = Math.asin(-clamp(m12, -1, 1));
        if (Math.abs(m12) < 0.9999999) {
          this.x = Math.atan2(m32, m22);
          this.y = Math.atan2(m13, m11);
        } else {
          this.x = Math.atan2(-m23, m33);
          this.y = 0;
        }
        break;
    }
    this.order = order;

    return this;
  }

  setFromQuaternion(q: Quaternion, order: EulerOrder): this {
    _matrix.makeRotationFromQuaternion(q);

    return this.setFromRotationMatrix(_matrix, order);
  }

  setFromVector3(v: Vector3, order: EulerOrder = this.order): this {
    return this.set(v.x, v.y, v.z, order);
  }

  reorder(newOrder: EulerOrder): this {
    _quaternion.setFromEuler(this);

    return this.setFromQuaternion(_quaternion, newOrder);
  }

  equals(euler: Euler): boolean {
    return euler.x === this.x && euler.y === this.y && euler.z === this.z && euler.order === this.order;
  }

  fromArray(array: [number, number, number] | [number, number, number, EulerOrder]): this {
    this.x = array[0];
    this.y = array[1];
    this.z = array[2];
    if (array[3] !== undefined) this.order = array[3];

    return this;
  }

  toArray(
    array: [number, number, number, EulerOrder] = [] as unknown as [number, number, number, EulerOrder],
    offset: number = 0,
  ): [number, number, number, EulerOrder] {
    array[offset] = this.x;
    array[offset + 1] = this.y;
    array[offset + 2] = this.z;
    array[offset + 3] = this.order;

    return array;
  }

  *[Symbol.iterator](): Iterator<number | EulerOrder> {
    yield this.x;
    yield this.y;
    yield this.z;
    yield this.order;
  }
}

export interface Euler_ {
  x: number;
  y: number;
  z: number;
  order: EulerOrder;
}

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

type Mat3x3 = number[];

export namespace Euler_ {
  export const create = (x: number, y: number, z: number, order: Order = 'XYZ'): Euler_ => ({ x, y, z, order });
  export const euler = create;

  export const empty = (): Euler_ => create(0, 0, 0, 'XYZ');
  export type Order = 'XYZ' | 'YXZ' | 'ZXY' | 'ZYX' | 'YZX' | 'XZY';

  export const copy = ({ x, y, z, order }: Euler_): Euler_ => create(x, y, z, order);
  export const fill = (self: Euler_, x: number, y: number, z: number, order: Order): Euler_ => {
    self.x = x;
    self.y = y;
    self.z = z;
    self.order = order;

    return self;
  };
  export const fill_ = ({ order, x, y, z }: Euler_, into: Euler_): Euler_ => {
    into.x = x;
    into.y = y;
    into.z = z;
    into.order = order;

    return into;
  };

  export const fromVec = ({ x, y, z }: Readonly<Vec3>, order: Order = 'XYZ'): Euler_ => create(x, y, z, order);
  export const fromVec_ = ({ x, y, z }: Readonly<Vec3>, into: Euler_): Euler_ => fill(into, x, y, z, into.order);
  export const fillVec = (self: Euler_, vec: Readonly<Vec3>): Euler_ => {
    self.x = vec.x;
    self.y = vec.y;
    self.z = vec.z;

    return self;
  };

  export const fromMat = (matrix: Readonly<Mat3x3>, order: Order): Euler_ => fromMat_(matrix, order, empty());
  export const fromMat_ = (matrix: Readonly<Mat3x3>, order: Order, into: Euler_): Euler_ => {
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
  export const fillMat = (self: Euler_, matrix: Readonly<Mat3x3>): Euler_ => fromMat_(matrix, self.order, self);

  export const fromQuaternion = (quaternion: Quaternion_, order: Order): Euler_ =>
    fromQuaternion_(quaternion, order, empty());
  export const fromQuaternion_ = (quaternion: Quaternion_, order: Order, into: Euler_): Euler_ =>
    fromMat_(0, order, into);
  export const fillQuaternion = (self: Euler_, quaternion: Quaternion_): Euler_ =>
    fromQuaternion_(quaternion, self.order, self);

  export const fromArray = (array: Readonly<(number | string)[]>, offset: number) => fromArray_(array, offset, empty());
  export const fromArray_ = (array: Readonly<(number | string)[]>, offset: number, into: Euler_) =>
    fill(
      into,
      array[offset] as number,
      array[offset + 1] as number,
      array[offset + 2] as number,
      array[offset + 3] as Order,
    );
  export const fillArray = (self: Euler_, array: (number | string)[], offset: number) =>
    fromArray_(array, offset, self);
  export const intoArray_ = (
    { x, y, z, order }: Euler_,
    array: (number | string)[],
    offset: number,
  ): (number | string)[] => {
    array[offset] = x;
    array[offset + 1] = y;
    array[offset + 2] = z;
    array[offset + 3] = order;

    return array;
  };
  export const intoArray = (self: Euler_): (number | string)[] => intoArray_(self, [0, 0, 0, 'XYZ'], 0);

  export const reorder = (self: Euler_, order: Order): Euler_ => reorder_(self, order, self);
  export const reorder_ = (self: Euler_, order: Order, into: Euler_): Euler_ =>
    fromQuaternion_(Quaternion_.fromEuler(self), order, into);
  export const reordered = (self: Euler_, order: Order): Euler_ => reorder_(self, order, empty());

  export const equals = (a: Euler_, b: Euler_): boolean =>
    b.x === a.x && b.y === a.y && b.z === a.z && b.order === a.order;
}
export type EulerOrder = Euler_.Order;
