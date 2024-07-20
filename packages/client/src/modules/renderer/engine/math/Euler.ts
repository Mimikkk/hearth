import { Quaternion } from './Quaternion.js';
import { Mat4 } from './Mat4.js';
import { clamp } from './MathUtils.js';
import { Vec3 } from '@modules/renderer/engine/math/Vec3.js';
import { Const } from '@modules/renderer/engine/math/types.js';

const _matrix = /*@__PURE__*/ new Mat4();
const _quaternion = /*@__PURE__*/ new Quaternion();

type EulerOrder = 'XYZ' | 'YXZ' | 'ZXY' | 'ZYX' | 'YZX' | 'XZY';
export class Euler {
  static DEFAULT_ORDER: EulerOrder = 'XYZ';
  declare isEuler: true;
  declare ['constructor']: typeof Euler;

  _x: number;
  _y: number;
  _z: number;
  _order: EulerOrder;

  constructor(x = 0, y = 0, z = 0, order = Euler.DEFAULT_ORDER) {
    this._x = x;
    this._y = y;
    this._z = z;
    this._order = order;
  }

  get x(): number {
    return this._x;
  }

  set x(value: number) {
    this._x = value;
    this._onChangeCallback();
  }

  get y(): number {
    return this._y;
  }

  set y(value: number) {
    this._y = value;
    this._onChangeCallback();
  }

  get z(): number {
    return this._z;
  }

  set z(value: number) {
    this._z = value;
    this._onChangeCallback();
  }

  get order(): EulerOrder {
    return this._order;
  }

  set order(value: EulerOrder) {
    this._order = value;
    this._onChangeCallback();
  }

  set(x: number, y: number, z: number, order: EulerOrder = this._order) {
    this._x = x;
    this._y = y;
    this._z = z;
    this._order = order;

    this._onChangeCallback();

    return this;
  }

  clone(): Euler {
    return new this.constructor(this._x, this._y, this._z, this._order);
  }

  copy(euler: Euler): this {
    this._x = euler._x;
    this._y = euler._y;
    this._z = euler._z;
    this._order = euler._order;

    this._onChangeCallback();

    return this;
  }

  setFromRotationMatrix(m: Mat4, order: EulerOrder = this._order, update: boolean = true): this {
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
        this._y = Math.asin(clamp(m13, -1, 1));

        if (Math.abs(m13) < 0.9999999) {
          this._x = Math.atan2(-m23, m33);
          this._z = Math.atan2(-m12, m11);
        } else {
          this._x = Math.atan2(m32, m22);
          this._z = 0;
        }

        break;
      case 'YXZ':
        this._x = Math.asin(-clamp(m23, -1, 1));

        if (Math.abs(m23) < 0.9999999) {
          this._y = Math.atan2(m13, m33);
          this._z = Math.atan2(m21, m22);
        } else {
          this._y = Math.atan2(-m31, m11);
          this._z = 0;
        }
        break;
      case 'ZXY':
        this._x = Math.asin(clamp(m32, -1, 1));

        if (Math.abs(m32) < 0.9999999) {
          this._y = Math.atan2(-m31, m33);
          this._z = Math.atan2(-m12, m22);
        } else {
          this._y = 0;
          this._z = Math.atan2(m21, m11);
        }
        break;
      case 'ZYX':
        this._y = Math.asin(-clamp(m31, -1, 1));

        if (Math.abs(m31) < 0.9999999) {
          this._x = Math.atan2(m32, m33);
          this._z = Math.atan2(m21, m11);
        } else {
          this._x = 0;
          this._z = Math.atan2(-m12, m22);
        }
        break;
      case 'YZX':
        this._z = Math.asin(clamp(m21, -1, 1));

        if (Math.abs(m21) < 0.9999999) {
          this._x = Math.atan2(-m23, m22);
          this._y = Math.atan2(-m31, m11);
        } else {
          this._x = 0;
          this._y = Math.atan2(m13, m33);
        }
        break;
      case 'XZY':
        this._z = Math.asin(-clamp(m12, -1, 1));

        if (Math.abs(m12) < 0.9999999) {
          this._x = Math.atan2(m32, m22);
          this._y = Math.atan2(m13, m11);
        } else {
          this._x = Math.atan2(-m23, m33);
          this._y = 0;
        }
        break;
      default:
        console.warn(`engine.Euler: .setFromRotationMatrix() encountered an unknown order: ${order}`);
    }
    this._order = order;

    if (update) this._onChangeCallback();

    return this;
  }

  setFromQuaternion(q: Quaternion, order: EulerOrder, update: boolean = true): this {
    _matrix.makeRotationFromQuaternion(q);

    return this.setFromRotationMatrix(_matrix, order, update);
  }

  setFromVec3(v: Vec3, order: EulerOrder = this._order): this {
    return this.set(v.x, v.y, v.z, order);
  }

  reorder(newOrder: EulerOrder): this {
    _quaternion.setFromEuler(this);

    return this.setFromQuaternion(_quaternion, newOrder);
  }

  equals(euler: Euler): boolean {
    return euler._x === this._x && euler._y === this._y && euler._z === this._z && euler._order === this._order;
  }

  fromArray(array: [number, number, number] | [number, number, number, EulerOrder]): this {
    this._x = array[0];
    this._y = array[1];
    this._z = array[2];
    if (array[3] !== undefined) this._order = array[3];

    this._onChangeCallback();

    return this;
  }

  toArray(
    array: [number, number, number, EulerOrder] = [] as unknown as [number, number, number, EulerOrder],
    offset: number = 0,
  ): [number, number, number, EulerOrder] {
    array[offset] = this._x;
    array[offset + 1] = this._y;
    array[offset + 2] = this._z;
    array[offset + 3] = this._order;

    return array;
  }

  _onChange(callback: () => void): this {
    this._onChangeCallback = callback;

    return this;
  }

  _onChangeCallback() {}

  // static new(x: number = 0, y: number = 0, z: number = 0, order: EulerOrder = 'XYZ'): Euler {
  //   return new Euler(x, y, z, order);
  // }
  //
  // static empty(): Euler {
  //   return new Euler(0, 0, 0, 'XYZ');
  // }
  //
  // static clone(from: Const<Euler>, into: Euler = Euler.new()): Euler {
  //   return into.from(from);
  // }
  //
  // static is(from: any): from is Euler {
  //   return from?.isEuler === true;
  // }
  //
  // static into(into: Euler, from: Const<Euler>): Euler {
  //   return into.from(from);
  // }
  //
  // static from(from: Const<Euler>, into: Euler = Euler.new()): Euler {
  //   return into.from(from);
  // }
  //
  // static fromVec(vec: Const<Vec3>, order: EulerOrder = 'XYZ', into: Euler = Euler.new()): Euler {
  //   return into.fromVec(vec, order);
  // }
  //
  // static fromMat4(matrix: Const<Mat4>, order: EulerOrder, into: Euler = Euler.new()): Euler {
  //   return into.fromMat4(matrix, order);
  // }
  //
  // static fromQuaternion(quaternion: Const<Quaternion>, order: EulerOrder, into: Euler = Euler.new()): Euler {
  //   return into.fromQuaternion(quaternion, order);
  // }
  //
  // static fromArray(array: Const<number | string>[], offset: number, into: Euler = Euler.new()): Euler {
  //   return into.fromArray(array, offset);
  // }
  //
  // set(x: number, y: number, z: number, order: EulerOrder = this.order): this {
  //   this.x = x;
  //   this.y = y;
  //   this.z = z;
  //   this.order = order;
  //   return this;
  // }
  //
  // setX(x: number): this {
  //   this.x = x;
  //   return this;
  // }
  //
  // setY(y: number): this {
  //   this.y = y;
  //   return this;
  // }
  //
  // setZ(z: number): this {
  //   this.z = z;
  //   return this;
  // }
  //
  // setOrder(order: EulerOrder): this {
  //   this.order = order;
  //   return this;
  // }
  //
  // fill(into: Euler): void {
  //   into.from(this);
  // }
  //
  // from({ order, x, y, z }: Const<Euler>): this {
  //   return this.set(x, y, z, order);
  // }
  //
  // fromVec({ x, y, z }: Const<Vec3>, order: EulerOrder = 'XYZ'): this {
  //   return this.set(x, y, z, order);
  // }
  //
  // fromMat4({ elements: e }: Const<Mat4>, order: EulerOrder): this {
  //   const m11 = e[0];
  //   const m12 = e[4];
  //   const m13 = e[8];
  //   const m21 = e[1];
  //   const m22 = e[5];
  //   const m23 = e[9];
  //   const m31 = e[2];
  //   const m32 = e[6];
  //   const m33 = e[10];
  //
  //   switch (order) {
  //     case 'XYZ':
  //       this.y = Math.asin(clamp(m13, -1, 1));
  //       if (Math.abs(m13) < 0.9999999) {
  //         this.x = Math.atan2(-m23, m33);
  //         this.z = Math.atan2(-m12, m11);
  //       } else {
  //         this.x = Math.atan2(m32, m22);
  //         this.z = 0;
  //       }
  //       break;
  //     case 'YXZ':
  //       this.x = Math.asin(-clamp(m23, -1, 1));
  //       if (Math.abs(m23) < 0.9999999) {
  //         this.y = Math.atan2(m13, m33);
  //         this.z = Math.atan2(m21, m22);
  //       } else {
  //         this.y = Math.atan2(-m31, m11);
  //         this.z = 0;
  //       }
  //       break;
  //     case 'ZXY':
  //       this.x = Math.asin(clamp(m32, -1, 1));
  //       if (Math.abs(m32) < 0.9999999) {
  //         this.y = Math.atan2(-m31, m33);
  //         this.z = Math.atan2(-m12, m22);
  //       } else {
  //         this.y = 0;
  //         this.z = Math.atan2(m21, m11);
  //       }
  //       break;
  //     case 'ZYX':
  //       this.y = Math.asin(-clamp(m31, -1, 1));
  //       if (Math.abs(m31) < 0.9999999) {
  //         this.x = Math.atan2(m32, m33);
  //         this.z = Math.atan2(m21, m11);
  //       } else {
  //         this.x = 0;
  //         this.z = Math.atan2(-m12, m22);
  //       }
  //       break;
  //     case 'YZX':
  //       this.z = Math.asin(clamp(m21, -1, 1));
  //       if (Math.abs(m21) < 0.9999999) {
  //         this.x = Math.atan2(-m23, m22);
  //         this.y = Math.atan2(-m31, m11);
  //       } else {
  //         this.x = 0;
  //         this.y = Math.atan2(m13, m33);
  //       }
  //       break;
  //     case 'XZY':
  //       this.z = Math.asin(-clamp(m12, -1, 1));
  //       if (Math.abs(m12) < 0.9999999) {
  //         this.x = Math.atan2(m32, m22);
  //         this.y = Math.atan2(m13, m11);
  //       } else {
  //         this.x = Math.atan2(-m23, m33);
  //         this.y = 0;
  //       }
  //       break;
  //   }
  //   this.order = order;
  //   return this;
  // }
  //
  // fromQuaternion(quaternion: Const<Quaternion>, order: EulerOrder): this {
  //   return this.fromMat4(new Mat4().asRotationFromQuaternion(quaternion), order);
  // }
  //
  // fromArray(array: Const<number | string>[], offset: number): this {
  //   return this.set(
  //     array[offset] as number,
  //     array[offset + 1] as number,
  //     array[offset + 2] as number,
  //     array[offset + 3] as EulerOrder,
  //   );
  // }
  //
  // intoArray(array: (number | string)[] = [0, 0, 0, 'XYZ'], offset: number = 0): (number | string)[] {
  //   array[offset] = this.x;
  //   array[offset + 1] = this.y;
  //   array[offset + 2] = this.z;
  //   array[offset + 3] = this.order;
  //
  //   return array;
  // }
  //
  // reorder(order: EulerOrder): this {
  //   return this.fromQuaternion(Quaternion.fromEuler(this), order);
  // }
  //
  // equals(euler: Const<Euler>): boolean {
  //   return euler.x === this.x && euler.y === this.y && euler.z === this.z && euler.order === this.order;
  // }

  *[Symbol.iterator](): Iterator<number | EulerOrder> {
    yield this._x;
    yield this._y;
    yield this._z;
    yield this._order;
  }
}
Euler.prototype.isEuler = true;
