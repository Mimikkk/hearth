import { Quaternion } from './Quaternion.js';
import { Matrix4 } from './Matrix4.js';
import { clamp } from './MathUtils.js';
import type { IVec3 } from '@modules/renderer/engine/math/Vector3.js';
import type { Const } from '@modules/renderer/engine/math/types.js';

export type EulerOrder = 'XYZ' | 'YXZ' | 'ZXY' | 'ZYX' | 'YZX' | 'XZY';

export class Euler {
  static orders: EulerOrder[] = ['XYZ', 'YXZ', 'ZXY', 'ZYX', 'YZX', 'XZY'];
  declare isEuler: true;

  constructor(
    public x: number = 0,
    public y: number = 0,
    public z: number = 0,
    public order: EulerOrder = 'XYZ',
  ) {}

  static new(x: number = 0, y: number = 0, z: number = 0, order: EulerOrder = 'XYZ'): Euler {
    return new Euler(x, y, z, order);
  }

  static empty(): Euler {
    return new Euler(0, 0, 0, 'XYZ');
  }

  static clone(from: Const<Euler>, into: Euler = Euler.new()): Euler {
    return into.from(from);
  }

  static is(from: any): from is Euler {
    return from?.isEuler === true;
  }

  static into(into: Euler, from: Const<Euler>): Euler {
    return into.from(from);
  }

  static from(from: Const<Euler>, into: Euler = Euler.new()): Euler {
    return into.from(from);
  }

  static fromVec(vec: Const<IVec3>, order: EulerOrder = 'XYZ', into: Euler = Euler.new()): Euler {
    return into.fromVec(vec, order);
  }

  static fromMat4(matrix: Const<Matrix4>, order: EulerOrder, into: Euler = Euler.new()): Euler {
    return into.fromMat4(matrix, order);
  }

  static fromQuaternion(quaternion: Const<Quaternion>, order: EulerOrder, into: Euler = Euler.new()): Euler {
    return into.fromQuaternion(quaternion, order);
  }

  static fromArray(array: Const<number | string>[], offset: number, into: Euler = Euler.new()): Euler {
    return into.fromArray(array, offset);
  }

  set(x: number, y: number, z: number, order: EulerOrder): this {
    this.x = x;
    this.y = y;
    this.z = z;
    this.order = order;
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

  setOrder(order: EulerOrder): this {
    this.order = order;
    return this;
  }

  fill(into: Euler): void {
    into.from(this);
  }

  from({ order, x, y, z }: Const<Euler>): this {
    return this.set(x, y, z, order);
  }

  fromVec({ x, y, z }: Const<IVec3>, order: EulerOrder = 'XYZ'): this {
    return this.set(x, y, z, order);
  }

  fromMat4({ elements: e }: Const<Matrix4>, order: EulerOrder): this {
    const m11 = e[0];
    const m12 = e[4];
    const m13 = e[8];
    const m21 = e[1];
    const m22 = e[5];
    const m23 = e[9];
    const m31 = e[2];
    const m32 = e[6];
    const m33 = e[10];

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

  fromQuaternion(quaternion: Const<Quaternion>, order: EulerOrder): this {
    return this.fromMat4(new Matrix4().makeRotationFromQuaternion(quaternion), order);
  }

  fromArray(array: Const<number | string>[], offset: number): this {
    return this.set(
      array[offset] as number,
      array[offset + 1] as number,
      array[offset + 2] as number,
      array[offset + 3] as EulerOrder,
    );
  }

  intoArray(array: (number | string)[] = [0, 0, 0, 'XYZ'], offset: number = 0): (number | string)[] {
    array[offset] = this.x;
    array[offset + 1] = this.y;
    array[offset + 2] = this.z;
    array[offset + 3] = this.order;

    return array;
  }

  reorder(order: EulerOrder): this {
    return this.fromQuaternion(Quaternion.fromEuler(this), order);
  }

  equals(euler: Const<Euler>): boolean {
    return euler.x === this.x && euler.y === this.y && euler.z === this.z && euler.order === this.order;
  }
}

Euler.prototype.isEuler = true;
