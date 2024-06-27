import { Quaternion } from './Quaternion.js';
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
      default:
        console.warn(`engine.Euler: .setFromRotationMatrix() encountered an unknown order: ${order}`);
    }
    this.order = order;

    return this;
  }

  setFromQuaternion(q: Quaternion, order: EulerOrder, update: boolean = true): this {
    _matrix.makeRotationFromQuaternion(q);

    return this.setFromRotationMatrix(_matrix, order, update);
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

  export const equals = (a: Euler_, b: Euler_): boolean =>
    b.x === a.x && b.y === a.y && b.z === a.z && b.order === a.order;
}
export type EulerOrder = Euler_.Order;
