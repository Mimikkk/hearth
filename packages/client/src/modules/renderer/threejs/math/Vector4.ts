import type { Vector3 } from './Vector3.js';
import type { Matrix4 } from './Matrix4.js';
import type { Quaternion } from './Quaternion.js';
import type { Matrix3 } from './Matrix3.js';
import type { BufferAttribute } from '../core/BufferAttribute.js';

export class Vector4 {
  declare isVector4: true;
  declare ['constructor']: typeof Vector4;

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

  setComponent(index: 0 | 1 | 2 | 3, value: number): this {
    switch (index) {
      case 0:
        this.x = value;
        break;
      case 1:
        this.y = value;
        break;
      case 2:
        this.z = value;
        break;
      case 3:
        this.w = value;
        break;
      default:
        throw Error(`index out of range: ${index}`);
    }

    return this;
  }

  getComponent(index: 0 | 1 | 2 | 3): number {
    switch (index) {
      case 0:
        return this.x;
      case 1:
        return this.y;
      case 2:
        return this.z;
      case 3:
        return this.w;
      default:
        throw new Error('index is out of range: ' + index);
    }
  }

  clone(): Vector4 {
    return new this.constructor(this.x, this.y, this.z, this.w);
  }

  copy(vector: Vector3 | Vector4): this {
    this.x = vector.x;
    this.y = vector.y;
    this.z = vector.z;
    this.w = 'w' in vector ? vector.w : 1;

    return this;
  }

  add(vector: Vector4): this {
    this.x += vector.x;
    this.y += vector.y;
    this.z += vector.z;
    this.w += vector.w;

    return this;
  }

  addScalar(scalar: number): this {
    this.x += scalar;
    this.y += scalar;
    this.z += scalar;
    this.w += scalar;

    return this;
  }

  addVectors(a: Vector4, b: Vector4): this {
    this.x = a.x + b.x;
    this.y = a.y + b.y;
    this.z = a.z + b.z;
    this.w = a.w + b.w;

    return this;
  }

  addScaledVector(vector: Vector4, scale: number): this {
    this.x += vector.x * scale;
    this.y += vector.y * scale;
    this.z += vector.z * scale;
    this.w += vector.w * scale;

    return this;
  }

  sub(vector: Vector4): this {
    this.x -= vector.x;
    this.y -= vector.y;
    this.z -= vector.z;
    this.w -= vector.w;

    return this;
  }

  subScalar(scalar: number): this {
    this.x -= scalar;
    this.y -= scalar;
    this.z -= scalar;
    this.w -= scalar;

    return this;
  }

  subVectors(a: Vector4, b: Vector4): this {
    this.x = a.x - b.x;
    this.y = a.y - b.y;
    this.z = a.z - b.z;
    this.w = a.w - b.w;

    return this;
  }

  multiply(vector: Vector4): this {
    this.x *= vector.x;
    this.y *= vector.y;
    this.z *= vector.z;
    this.w *= vector.w;

    return this;
  }

  multiplyScalar(scalar: number): this {
    this.x *= scalar;
    this.y *= scalar;
    this.z *= scalar;
    this.w *= scalar;

    return this;
  }

  applyMatrix4(matrix: Matrix4): this {
    const { x, y, z, w } = this;
    const e = matrix.elements;

    this.x = e[0] * x + e[4] * y + e[8] * z + e[12] * w;
    this.y = e[1] * x + e[5] * y + e[9] * z + e[13] * w;
    this.z = e[2] * x + e[6] * y + e[10] * z + e[14] * w;
    this.w = e[3] * x + e[7] * y + e[11] * z + e[15] * w;

    return this;
  }

  divideScalar(scalar: number): this {
    return this.multiplyScalar(1 / scalar);
  }

  setAxisAngleFromQuaternion(quaternion: Quaternion): this {
    this.w = 2 * Math.acos(quaternion.w);

    const s = Math.sqrt(1 - quaternion.w * quaternion.w);

    if (s < 0.0001) {
      this.x = 1;
      this.y = 0;
      this.z = 0;
    } else {
      this.x = quaternion.x / s;
      this.y = quaternion.y / s;
      this.z = quaternion.z / s;
    }

    return this;
  }

  setAxisAngleFromRotationMatrix(matrix: Matrix3 | Matrix4): this {
    // http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToAngle/index.htm

    // assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

    let angle, x, y, z; // variables for result
    const epsilon = 0.01, // margin to allow for rounding errors
      epsilon2 = 0.1, // margin to distinguish between 0 and 180 degrees
      te = matrix.elements,
      m11 = te[0],
      m12 = te[4],
      m13 = te[8],
      m21 = te[1],
      m22 = te[5],
      m23 = te[9],
      m31 = te[2],
      m32 = te[6],
      m33 = te[10];

    if (Math.abs(m12 - m21) < epsilon && Math.abs(m13 - m31) < epsilon && Math.abs(m23 - m32) < epsilon) {
      // singularity found
      // first check for identity matrix which must have +1 for all terms
      // in leading diagonal and zero in other terms

      if (
        Math.abs(m12 + m21) < epsilon2 &&
        Math.abs(m13 + m31) < epsilon2 &&
        Math.abs(m23 + m32) < epsilon2 &&
        Math.abs(m11 + m22 + m33 - 3) < epsilon2
      ) {
        // this singularity is identity matrix so angle = 0

        this.set(1, 0, 0, 0);

        return this; // zero angle, arbitrary axis
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

        if (xx < epsilon) {
          x = 0;
          y = 0.707106781;
          z = 0.707106781;
        } else {
          x = Math.sqrt(xx);
          y = xy / x;
          z = xz / x;
        }
      } else if (yy > zz) {
        // m22 is the largest diagonal term

        if (yy < epsilon) {
          x = 0.707106781;
          y = 0;
          z = 0.707106781;
        } else {
          y = Math.sqrt(yy);
          x = xy / y;
          z = yz / y;
        }
      } else {
        // m33 is the largest diagonal term so base result on this

        if (zz < epsilon) {
          x = 0.707106781;
          y = 0.707106781;
          z = 0;
        } else {
          z = Math.sqrt(zz);
          x = xz / z;
          y = yz / z;
        }
      }

      this.set(x, y, z, angle);

      return this; // return 180 deg rotation
    }

    // as we have reached here there are no singularities so we can handle normally

    let s = Math.sqrt((m32 - m23) * (m32 - m23) + (m13 - m31) * (m13 - m31) + (m21 - m12) * (m21 - m12)); // used to normalize

    if (Math.abs(s) < 0.001) s = 1;

    // prevent divide by zero, should not happen if matrix is orthogonal and should be
    // caught by singularity test above, but I've left it in just in case

    this.x = (m32 - m23) / s;
    this.y = (m13 - m31) / s;
    this.z = (m21 - m12) / s;
    this.w = Math.acos((m11 + m22 + m33 - 1) / 2);

    return this;
  }

  min(vector: Vector4): this {
    this.x = Math.min(this.x, vector.x);
    this.y = Math.min(this.y, vector.y);
    this.z = Math.min(this.z, vector.z);
    this.w = Math.min(this.w, vector.w);

    return this;
  }

  max(vector: Vector4): this {
    this.x = Math.max(this.x, vector.x);
    this.y = Math.max(this.y, vector.y);
    this.z = Math.max(this.z, vector.z);
    this.w = Math.max(this.w, vector.w);

    return this;
  }

  clamp(min: Vector4, max: Vector4): this {
    this.x = Math.max(min.x, Math.min(max.x, this.x));
    this.y = Math.max(min.y, Math.min(max.y, this.y));
    this.z = Math.max(min.z, Math.min(max.z, this.z));
    this.w = Math.max(min.w, Math.min(max.w, this.w));

    return this;
  }

  clampScalar(min: number, max: number): this {
    this.x = Math.max(min, Math.min(max, this.x));
    this.y = Math.max(min, Math.min(max, this.y));
    this.z = Math.max(min, Math.min(max, this.z));
    this.w = Math.max(min, Math.min(max, this.w));

    return this;
  }

  clampLength(min: number, max: number): this {
    const length = this.length();

    return this.divideScalar(length || 1).multiplyScalar(Math.max(min, Math.min(max, length)));
  }

  floor(): this {
    this.x = Math.floor(this.x);
    this.y = Math.floor(this.y);
    this.z = Math.floor(this.z);
    this.w = Math.floor(this.w);

    return this;
  }

  ceil(): this {
    this.x = Math.ceil(this.x);
    this.y = Math.ceil(this.y);
    this.z = Math.ceil(this.z);
    this.w = Math.ceil(this.w);

    return this;
  }

  round(): this {
    this.x = Math.round(this.x);
    this.y = Math.round(this.y);
    this.z = Math.round(this.z);
    this.w = Math.round(this.w);

    return this;
  }

  roundToZero(): this {
    this.x = Math.trunc(this.x);
    this.y = Math.trunc(this.y);
    this.z = Math.trunc(this.z);
    this.w = Math.trunc(this.w);

    return this;
  }

  negate(): this {
    this.x = -this.x;
    this.y = -this.y;
    this.z = -this.z;
    this.w = -this.w;

    return this;
  }

  dot(vector: Vector4) {
    return this.x * vector.x + this.y * vector.y + this.z * vector.z + this.w * vector.w;
  }

  lengthSq(): number {
    return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;
  }

  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
  }

  manhattanLength(): number {
    return Math.abs(this.x) + Math.abs(this.y) + Math.abs(this.z) + Math.abs(this.w);
  }

  normalize(): this {
    return this.divideScalar(this.length() || 1);
  }

  setLength(length: number): this {
    return this.normalize().multiplyScalar(length);
  }

  lerp(vector: Vector4, alpha: number): this {
    this.x += (vector.x - this.x) * alpha;
    this.y += (vector.y - this.y) * alpha;
    this.z += (vector.z - this.z) * alpha;
    this.w += (vector.w - this.w) * alpha;

    return this;
  }

  lerpVectors(from: Vector4, to: Vector4, alpha: number): this {
    this.x = from.x + (to.x - from.x) * alpha;
    this.y = from.y + (to.y - from.y) * alpha;
    this.z = from.z + (to.z - from.z) * alpha;
    this.w = from.w + (to.w - from.w) * alpha;

    return this;
  }

  equals(vector: Vector4): boolean {
    return vector.x === this.x && vector.y === this.y && vector.z === this.z && vector.w === this.w;
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

  fromBufferAttribute(attribute: BufferAttribute, index: number): this {
    this.x = attribute.getX(index);
    this.y = attribute.getY(index);
    this.z = attribute.getZ(index);
    this.w = attribute.getW(index);

    return this;
  }

  random(): this {
    this.x = Math.random();
    this.y = Math.random();
    this.z = Math.random();
    this.w = Math.random();

    return this;
  }

  *[Symbol.iterator](): Iterator<number> {
    yield this.x;
    yield this.y;
    yield this.z;
    yield this.w;
  }
}
Vector4.prototype.isVector4 = true;
