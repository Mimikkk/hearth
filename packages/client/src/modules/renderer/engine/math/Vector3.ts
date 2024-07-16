import { clamp as clampNumber, NumberArray } from './MathUtils.js';
import { Quaternion } from './Quaternion.js';
import type { BufferAttribute } from '@modules/renderer/engine/core/BufferAttribute.js';
import type { InterleavedBufferAttribute } from '@modules/renderer/engine/core/InterleavedBufferAttribute.js';
import type { Color } from '@modules/renderer/engine/math/Color.js';
import { Euler } from '@modules/renderer/engine/math/Euler.js';
import type { Matrix3 } from '@modules/renderer/engine/math/Matrix3.js';
import type { Matrix4 } from '@modules/renderer/engine/math/Matrix4.js';
import type { Cylindrical } from '@modules/renderer/engine/math/Cylindrical.js';
import type { Spherical } from '@modules/renderer/engine/math/Spherical.js';
import type { Camera } from '@modules/renderer/engine/cameras/Camera.js';
import { Const } from '@modules/renderer/engine/math/types.js';

export interface IVector3 {
  x: number;
  y: number;
  z: number;
}

export class Vector3 implements IVector3 {
  declare isVector3: true;
  declare ['constructor']: typeof Vector3;

  constructor(
    public x: number = 0,
    public y: number = 0,
    public z: number = 0,
  ) {}

  set(x: number, y: number, z?: number): this {
    this.x = x;
    this.y = y;
    this.z = z ?? this.z;

    return this;
  }

  setScalar(scalar: number): this {
    this.x = scalar;
    this.y = scalar;
    this.z = scalar;

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

  setComponent(index: 0 | 1 | 2 | number, value: number): this {
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
      default:
        throw new Error(`index is out of range: ${index}`);
    }

    return this;
  }

  getComponent(index: 0 | 1 | 2 | number): number {
    switch (index) {
      case 0:
        return this.x;
      case 1:
        return this.y;
      case 2:
        return this.z;
      default:
        throw new Error('index is out of range: ' + index);
    }
  }

  clone(): Vector3 {
    return new this.constructor(this.x, this.y, this.z);
  }

  copy(v: IVec3): this {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;

    return this;
  }

  add(v: IVec3): this {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;

    return this;
  }

  addScalar(scalar: number): this {
    this.x += scalar;
    this.y += scalar;
    this.z += scalar;

    return this;
  }

  addVectors(a: IVec3, b: IVec3): this {
    this.x = a.x + b.x;
    this.y = a.y + b.y;
    this.z = a.z + b.z;

    return this;
  }

  addScaledVector(vector: IVec3, scale: number): this {
    this.x += vector.x * scale;
    this.y += vector.y * scale;
    this.z += vector.z * scale;

    return this;
  }

  sub(vector: IVec3): this {
    this.x -= vector.x;
    this.y -= vector.y;
    this.z -= vector.z;

    return this;
  }

  subScalar(scalar: number): this {
    this.x -= scalar;
    this.y -= scalar;
    this.z -= scalar;

    return this;
  }

  subVectors(a: IVec3, b: IVec3): this {
    this.x = a.x - b.x;
    this.y = a.y - b.y;
    this.z = a.z - b.z;

    return this;
  }

  multiply(vector: IVec3): this {
    this.x *= vector.x;
    this.y *= vector.y;
    this.z *= vector.z;

    return this;
  }

  multiplyScalar(scalar: number): this {
    this.x *= scalar;
    this.y *= scalar;
    this.z *= scalar;

    return this;
  }

  multiplyVectors(a: IVec3, b: IVec3): this {
    this.x = a.x * b.x;
    this.y = a.y * b.y;
    this.z = a.z * b.z;

    return this;
  }

  applyEuler(euler: Euler): this {
    return this.applyQuaternion(Quaternion.fromEuler(euler));
  }

  applyAxisAngle(axis: IVec3, angle: number): this {
    return this.applyQuaternion(Quaternion.fromAxisAngle(axis, angle));
  }

  applyMatrix3(matrix: Matrix3): this {
    const x = this.x;
    const y = this.y;
    const z = this.z;
    const e = matrix.elements;

    this.x = e[0] * x + e[3] * y + e[6] * z;
    this.y = e[1] * x + e[4] * y + e[7] * z;
    this.z = e[2] * x + e[5] * y + e[8] * z;

    return this;
  }

  applyNormalMatrix(matrix: Matrix3): this {
    return this.applyMatrix3(matrix).normalize();
  }

  applyMatrix4(matrix: Matrix4): this {
    const x = this.x,
      y = this.y,
      z = this.z;
    const e = matrix.elements;

    const w = 1 / (e[3] * x + e[7] * y + e[11] * z + e[15]);

    this.x = (e[0] * x + e[4] * y + e[8] * z + e[12]) * w;
    this.y = (e[1] * x + e[5] * y + e[9] * z + e[13]) * w;
    this.z = (e[2] * x + e[6] * y + e[10] * z + e[14]) * w;

    return this;
  }

  applyQuaternion(quaternion: Quaternion): this {
    const vx = this.x;
    const vy = this.y;
    const vz = this.z;
    const qx = quaternion.x;
    const qy = quaternion.y;
    const qz = quaternion.z;
    const qw = quaternion.w;

    // t = 2 * cross( q.xyz, v );
    const tx = 2 * (qy * vz - qz * vy);
    const ty = 2 * (qz * vx - qx * vz);
    const tz = 2 * (qx * vy - qy * vx);

    // v + q.w * t + cross( q.xyz, t );
    this.x = vx + qw * tx + qy * tz - qz * ty;
    this.y = vy + qw * ty + qz * tx - qx * tz;
    this.z = vz + qw * tz + qx * ty - qy * tx;

    return this;
  }

  project(camera: Camera): this {
    return this.applyMatrix4(camera.matrixWorldInverse).applyMatrix4(camera.projectionMatrix);
  }

  unproject(camera: Camera): this {
    return this.applyMatrix4(camera.projectionMatrixInverse).applyMatrix4(camera.matrixWorld);
  }

  transformDirection(m: Matrix4): this {
    // input: engine.Matrix4 affine matrix
    // vector interpreted as a direction

    const x = this.x,
      y = this.y,
      z = this.z;
    const e = m.elements;

    this.x = e[0] * x + e[4] * y + e[8] * z;
    this.y = e[1] * x + e[5] * y + e[9] * z;
    this.z = e[2] * x + e[6] * y + e[10] * z;

    return this.normalize();
  }

  divide(vector: IVec3): this {
    this.x /= vector.x;
    this.y /= vector.y;
    this.z /= vector.z;

    return this;
  }

  divideScalar(scalar: number): this {
    return this.multiplyScalar(1 / scalar);
  }

  min(vector: IVec3): this {
    this.x = Math.min(this.x, vector.x);
    this.y = Math.min(this.y, vector.y);
    this.z = Math.min(this.z, vector.z);

    return this;
  }

  max(vector: IVec3): this {
    this.x = Math.max(this.x, vector.x);
    this.y = Math.max(this.y, vector.y);
    this.z = Math.max(this.z, vector.z);

    return this;
  }

  clamp(min: IVec3, max: IVec3): this {
    this.x = Math.max(min.x, Math.min(max.x, this.x));
    this.y = Math.max(min.y, Math.min(max.y, this.y));
    this.z = Math.max(min.z, Math.min(max.z, this.z));

    return this;
  }

  clampScalar(min: number, max: number): this {
    this.x = Math.max(min, Math.min(max, this.x));
    this.y = Math.max(min, Math.min(max, this.y));
    this.z = Math.max(min, Math.min(max, this.z));

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

    return this;
  }

  ceil(): this {
    this.x = Math.ceil(this.x);
    this.y = Math.ceil(this.y);
    this.z = Math.ceil(this.z);

    return this;
  }

  round(): this {
    this.x = Math.round(this.x);
    this.y = Math.round(this.y);
    this.z = Math.round(this.z);

    return this;
  }

  roundToZero(): this {
    this.x = Math.trunc(this.x);
    this.y = Math.trunc(this.y);
    this.z = Math.trunc(this.z);

    return this;
  }

  negate(): this {
    this.x = -this.x;
    this.y = -this.y;
    this.z = -this.z;

    return this;
  }

  dot(vector: IVec3): number {
    return this.x * vector.x + this.y * vector.y + this.z * vector.z;
  }

  lengthSq(): number {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }

  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  manhattanLength(): number {
    return Math.abs(this.x) + Math.abs(this.y) + Math.abs(this.z);
  }

  normalize(): this {
    return this.divideScalar(this.length() || 1);
  }

  setLength(length: number): this {
    return this.normalize().multiplyScalar(length);
  }

  lerp(vector: IVec3, step: number): this {
    this.x += (vector.x - this.x) * step;
    this.y += (vector.y - this.y) * step;
    this.z += (vector.z - this.z) * step;

    return this;
  }

  lerpVectors(from: IVec3, to: IVec3, step: number): this {
    this.x = from.x + (to.x - from.x) * step;
    this.y = from.y + (to.y - from.y) * step;
    this.z = from.z + (to.z - from.z) * step;

    return this;
  }

  cross(vector: IVec3): this {
    return this.crossVectors(this, vector);
  }

  crossVectors(a: IVec3, b: IVec3): this {
    const ax = a.x,
      ay = a.y,
      az = a.z;
    const bx = b.x,
      by = b.y,
      bz = b.z;

    this.x = ay * bz - az * by;
    this.y = az * bx - ax * bz;
    this.z = ax * by - ay * bx;

    return this;
  }

  projectOnVector(vector: Vector3): this {
    const denominator = vector.lengthSq();

    if (denominator === 0) return this.set(0, 0, 0);

    const scalar = vector.dot(this) / denominator;

    return this.copy(vector).multiplyScalar(scalar);
  }

  projectOnPlane(normal: Vector3): this {
    return this.sub(this.clone().projectOnVector(normal));
  }

  reflect(normal: Vector3): this {
    return this.sub(normal.clone().multiplyScalar(2 * this.dot(normal)));
  }

  angleTo(vector: Vector3): number {
    const denominator = Math.sqrt(this.lengthSq() * vector.lengthSq());

    if (denominator === 0) return Math.PI / 2;

    const theta = this.dot(vector) / denominator;

    // clamp, to handle numerical problems

    return Math.acos(clampNumber(theta, -1, 1));
  }

  distanceTo(vector: Vector3): number {
    return Math.sqrt(this.distanceToSquared(vector));
  }

  distanceToSquared(vector: Vector3): number {
    const dx = this.x - vector.x,
      dy = this.y - vector.y,
      dz = this.z - vector.z;

    return dx * dx + dy * dy + dz * dz;
  }

  manhattanDistanceTo(vector: Vector3): number {
    return Math.abs(this.x - vector.x) + Math.abs(this.y - vector.y) + Math.abs(this.z - vector.z);
  }

  setFromSpherical(spherical: Spherical): this {
    return this.setFromSphericalCoords(spherical.radius, spherical.phi, spherical.theta);
  }

  setFromSphericalCoords(radius: number, phi: number, theta: number): this {
    const sinPhiRadius = Math.sin(phi) * radius;

    this.x = sinPhiRadius * Math.sin(theta);
    this.y = Math.cos(phi) * radius;
    this.z = sinPhiRadius * Math.cos(theta);

    return this;
  }

  setFromCylindrical(cylindrical: Cylindrical): this {
    return this.setFromCylindricalCoords(cylindrical.radius, cylindrical.theta, cylindrical.y);
  }

  setFromCylindricalCoords(radius: number, theta: number, y: number): this {
    this.x = radius * Math.sin(theta);
    this.y = y;
    this.z = radius * Math.cos(theta);

    return this;
  }

  setFromMatrixPosition(matrix: Matrix4): this {
    const e = matrix.elements;

    this.x = e[12];
    this.y = e[13];
    this.z = e[14];

    return this;
  }

  setFromMatrixScale(matrix: Matrix4): this {
    const sx = this.setFromMatrixColumn(matrix, 0).length();
    const sy = this.setFromMatrixColumn(matrix, 1).length();
    const sz = this.setFromMatrixColumn(matrix, 2).length();

    this.x = sx;
    this.y = sy;
    this.z = sz;

    return this;
  }

  setFromMatrixColumn(matrix: Matrix4, index: number): this {
    return this.fromArray(matrix.elements, index * 4);
  }

  setFromMatrix3Column(matrix: Matrix3, index: number): this {
    return this.fromArray(matrix.elements, index * 3);
  }

  setFromEuler(euler: Euler): this {
    this.x = euler.x;
    this.y = euler.y;
    this.z = euler.z;

    return this;
  }

  setFromColor(color: Color): this {
    this.x = color.r;
    this.y = color.g;
    this.z = color.b;

    return this;
  }

  equals(vector: Vector3): boolean {
    return vector.x === this.x && vector.y === this.y && vector.z === this.z;
  }

  fromArray(array: number[], offset = 0): this {
    this.x = array[offset];
    this.y = array[offset + 1];
    this.z = array[offset + 2];

    return this;
  }

  toArray(array: number[] = [], offset: number = 0): number[] {
    array[offset] = this.x;
    array[offset + 1] = this.y;
    array[offset + 2] = this.z;

    return array;
  }

  fromBufferAttribute(attribute: BufferAttribute<Float32Array> | InterleavedBufferAttribute, index: number): this {
    this.x = attribute.getX(index);
    this.y = attribute.getY(index);
    this.z = attribute.getZ(index);

    return this;
  }

  random(): this {
    this.x = Math.random();
    this.y = Math.random();
    this.z = Math.random();

    return this;
  }

  randomDirection(): this {
    // https://mathworld.wolfram.com/SpherePointPicking.html

    const theta = Math.random() * Math.PI * 2;
    const u = Math.random() * 2 - 1;
    const c = Math.sqrt(1 - u * u);

    this.x = c * Math.cos(theta);
    this.y = u;
    this.z = c * Math.sin(theta);

    return this;
  }

  *[Symbol.iterator](): Iterator<number> {
    yield this.x;
    yield this.y;
    yield this.z;
  }
}

Vector3.prototype.isVector3 = true;

export interface IVec3 {
  x: number;
  y: number;
  z: number;
}

const empty = () => Vec3.empty;
export class Vec3 implements IVec3 {
  constructor(
    public x: number,
    public y: number,
    public z: number,
  ) {}

  static create(x: number, y: number, z: number): Vec3 {
    return new Vec3(x, y, z);
  }

  static empty<T extends IVec3 = Vec3>(): T {
    return new Vec3(0, 0, 0) as unknown as T;
  }

  clear(): this {
    return IVec3.clear(this);
  }

  set(x: number, y: number, z: number): this {
    return IVec3.set(this, x, y, z);
  }

  from(vec: Const<IVec3>): this {
    return IVec3.fill(this, vec);
  }

  clone<T extends IVec3 = Vec3>(into: T = Vec3.empty<T>()): T {
    return IVec3.clone_(this, into);
  }

  negate<T extends IVec3 = Vec3>(into: T = this as never): T {
    return IVec3.negate_(this, into);
  }
}

export namespace IVec3 {
  export const create = Vec3.create;
  export const empty = Vec3.empty;
  export const vec3 = create;

  export const clear = <S extends IVec3>(self: S): S => set(self, 0, 0, 0);

  export const set = <S extends IVec3>(self: S, x: number, y: number, z: number): S => {
    self.x = x;
    self.y = y;
    self.z = z;

    return self;
  };
  export const fill = <S extends IVec3>(self: S, { x, y, z }: Const<IVec3>): S => set(self, x, y, z);

  export const clone = (from: Const<IVec3>): IVec3 => clone_(from, empty());
  export const clone_ = <S extends IVec3>(from: Const<IVec3>, into: S): S => fill(into, from);

  export const is = (o: any): o is IVec3 =>
    !!o && typeof o.x === 'number' && typeof o.y === 'number' && typeof o.z === 'number';

  export const negate = <S extends IVec3>(self: S): S => negate_(self, self);
  export const negate_ = <S extends IVec3>({ x, y, z }: Const<IVec3>, into: S): S => set(into, -x, -y, -z);
  export const negated = (from: Const<IVec3>): IVec3 => negate_(from, empty());

  export const clamp = <S extends IVec3>(self: IVec3, min: Const<IVec3>, max: Const<IVec3>): IVec3 =>
    clamp_(self, min, max, self);
  export const clamp_ = (from: Const<IVec3>, min: Const<IVec3>, max: Const<IVec3>, into: IVec3): IVec3 =>
    set(into, clampNumber(from.x, min.x, max.x), clampNumber(from.y, min.y, max.y), clampNumber(from.z, min.z, max.z));
  export const clamped = (a: Const<IVec3>, min: Const<IVec3>, max: Const<IVec3>): IVec3 => clamp_(a, min, max, empty());

  export const clampScalar = <S extends IVec3>(self: IVec3, min: number, max: number): IVec3 =>
    clampScalar_(self, min, max, self);
  export const clampScalar_ = (from: Const<IVec3>, min: number, max: number, into: IVec3): IVec3 =>
    set(into, clampNumber(from.x, min, max), clampNumber(from.y, min, max), clampNumber(from.z, min, max));
  export const clampedScalar = (from: Const<IVec3>, min: number, max: number): IVec3 =>
    clampScalar_(from, min, max, empty());

  export const clampLength = <S extends IVec3>(self: IVec3, min: number, max: number): IVec3 =>
    clampLength_(self, min, max, self);
  export const clampLength_ = (from: Const<IVec3>, min: number, max: number, into: IVec3): IVec3 => {
    const len = length(from) || 1;

    divScalar_(from, len, into);
    mulScalar(into, clampNumber(len, min, max));

    return into;
  };
  export const clampedLength = (from: Const<IVec3>, min: number, max: number): IVec3 =>
    clampLength_(from, min, max, empty());

  export const setLength = <S extends IVec3>(self: IVec3, length: number): IVec3 => setLength_(self, length, self);
  export const setLength_ = (from: Const<IVec3>, len: number, into: IVec3): IVec3 =>
    mulScalar_(from, len / (length(from) || 1), into);

  export const add = <S extends IVec3>(self: IVec3, vec: Const<IVec3>): IVec3 => add_(self, vec, self);
  export const add_ = (from: Const<IVec3>, vec: Const<IVec3>, into: IVec3): IVec3 =>
    set(into, from.x + vec.x, from.y + vec.y, from.z + vec.z);
  export const added = (a: IVec3, b: Const<IVec3>): IVec3 => add_(a, b, empty());

  export const addScaled = <S extends IVec3>(self: IVec3, vec: Const<IVec3>, scale: number): IVec3 =>
    addScaled_(self, vec, scale, self);
  export const addScaled_ = (from: Const<IVec3>, vec: Const<IVec3>, scale: number, into: IVec3): IVec3 =>
    set(into, from.x + vec.x * scale, from.y + vec.y * scale, from.z + vec.z * scale);
  export const addedScaled = (a: Const<IVec3>, b: Const<IVec3>, scale: number): IVec3 =>
    addScaled_(a, b, scale, empty());

  export const sub = <S extends IVec3>(a: IVec3, b: Const<IVec3>): IVec3 => sub_(a, b, a);
  export const sub_ = (a: Const<IVec3>, b: Const<IVec3>, into: IVec3): IVec3 =>
    set(into, a.x - b.x, a.y - b.y, a.z - b.z);
  export const subbed = (a: Const<IVec3>, b: Const<IVec3>): IVec3 => sub_(a, b, empty());

  export const subScaled = <S extends IVec3>(self: IVec3, vec: Const<IVec3>, scale: number): IVec3 =>
    subScaled_(self, vec, scale, self);
  export const subScaled_ = (from: Const<IVec3>, vec: Const<IVec3>, scale: number, into: IVec3): IVec3 =>
    set(into, from.x - vec.x * scale, from.y - vec.y * scale, from.z - vec.z * scale);
  export const subbedScaled = (a: Const<IVec3>, b: Const<IVec3>, scale: number): IVec3 =>
    subScaled_(a, b, scale, empty());

  export const mul = <S extends IVec3>(a: IVec3, b: Const<IVec3>): IVec3 => mul_(a, b, a);
  export const mul_ = (a: Const<IVec3>, b: Const<IVec3>, into: IVec3): IVec3 =>
    set(into, a.x * b.x, a.y * b.y, a.z * b.z);
  export const mulled = (a: Const<IVec3>, b: Const<IVec3>): IVec3 => mul_(a, b, empty());

  export const mulScalar = <S extends IVec3>(a: IVec3, scalar: number): IVec3 => mulScalar_(a, scalar, a);
  export const mulScalar_ = (a: Const<IVec3>, scalar: number, into: IVec3): IVec3 =>
    set(into, a.x * scalar, a.y * scalar, a.z * scalar);
  export const mulScalared = (a: Const<IVec3>, scalar: number): IVec3 => mulScalar_(a, scalar, empty());

  export const min = <S extends IVec3>(a: IVec3, b: Const<IVec3>): IVec3 => min_(a, b, a);
  export const min_ = (a: Const<IVec3>, b: Const<IVec3>, into: IVec3): IVec3 =>
    set(into, Math.min(a.x, b.x), Math.min(a.y, b.y), Math.min(a.z, b.z));
  export const mined = (a: Const<IVec3>, b: Const<IVec3>): IVec3 => min_(a, b, empty());

  export const max = <S extends IVec3>(a: IVec3, b: Const<IVec3>): IVec3 => max_(a, b, a);
  export const max_ = (a: Const<IVec3>, b: Const<IVec3>, into: IVec3): IVec3 =>
    set(into, Math.max(a.x, b.x), Math.max(a.y, b.y), Math.max(a.z, b.z));
  export const maxed = (a: Const<IVec3>, b: Const<IVec3>): IVec3 => max_(a, b, empty());

  export const ceil = <S extends IVec3>(self: IVec3): IVec3 => ceil_(self, self);
  export const ceil_ = (from: Const<IVec3>, into: IVec3): IVec3 =>
    set(into, Math.ceil(from.x), Math.ceil(from.y), Math.ceil(from.z));
  export const ceiled = (from: Const<IVec3>): IVec3 => ceil_(from, empty());

  export const floor = <S extends IVec3>(self: IVec3): IVec3 => floor_(self, self);
  export const floor_ = (from: Const<IVec3>, into: IVec3): IVec3 =>
    set(into, Math.floor(from.x), Math.floor(from.y), Math.floor(from.z));
  export const floored = (from: Const<IVec3>): IVec3 => floor_(from, empty());

  export const round = <S extends IVec3>(self: IVec3): IVec3 => round_(self, self);
  export const round_ = (from: Const<IVec3>, into: IVec3): IVec3 =>
    set(into, Math.round(from.x), Math.round(from.y), Math.round(from.z));
  export const rounded = (from: Const<IVec3>): IVec3 => round_(from, empty());

  export const trunc = <S extends IVec3>(self: IVec3): IVec3 => trunc_(self, self);
  export const trunc_ = (from: Const<IVec3>, into: IVec3): IVec3 =>
    set(into, Math.trunc(from.x), Math.trunc(from.y), Math.trunc(from.z));
  export const trunced = (from: Const<IVec3>): IVec3 => trunc_(from, empty());

  export const scale = <S extends IVec3>(a: IVec3, scalar: number): IVec3 => scale_(a, scalar, a);
  export const scale_ = (a: Const<IVec3>, scalar: number, into: IVec3): IVec3 =>
    set(into, a.x * scalar, a.y * scalar, a.z * scalar);
  export const scaled = (a: Const<IVec3>, scalar: number): IVec3 => scale_(a, scalar, empty());

  export const div = (a: IVec3, b: Const<IVec3>): IVec3 => div_(a, b, a);
  export const div_ = (a: Const<IVec3>, b: Const<IVec3>, into: IVec3): IVec3 =>
    set(into, a.x / b.x, a.y / b.y, a.z / b.z);
  export const dived = (a: Const<IVec3>, b: Const<IVec3>): IVec3 => div_(a, b, empty());

  export const divScalar = (a: IVec3, scalar: number): IVec3 => divScalar_(a, scalar, a);
  export const divScalar_ = (a: Const<IVec3>, scalar: number, into: IVec3): IVec3 =>
    set(into, a.x / scalar, a.y / scalar, a.z / scalar);
  export const divScalared = (a: Const<IVec3>, scalar: number): IVec3 => divScalar_(a, scalar, empty());

  export const cross = (a: Const<IVec3>, b: Const<IVec3>): IVec3 => cross_(a, b, a);
  export const cross_ = (a: Const<IVec3>, b: Const<IVec3>, into: IVec3): IVec3 =>
    set(into, a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
  export const crossed = (a: Const<IVec3>, b: Const<IVec3>): IVec3 => cross_(a, b, empty());

  export const normalize = (self: IVec3): IVec3 => normalize_(self, self);
  export const normalize_ = (self: Const<IVec3>, into: IVec3): IVec3 => {
    const length = Math.sqrt(self.x * self.x + self.y * self.y + self.z * self.z);
    if (length == 0) return set(into, 0, 0, 0);
    return set(into, self.x / length, self.y / length, self.z / length);
  };
  export const normalized = (self: Const<IVec3>): IVec3 => normalize_(self, empty());

  export const lerp = (a: IVec3, b: Const<IVec3>, step: number): IVec3 => lerp_(a, b, step, a);
  export const lerp_ = (a: Const<IVec3>, b: Const<IVec3>, step: number, into: IVec3): IVec3 =>
    set(into, a.x + (b.x - a.x) * step, a.y + (b.y - a.y) * step, a.z + (b.z - a.z) * step);
  export const lerped = (a: Const<IVec3>, b: Const<IVec3>, step: number): IVec3 => lerp_(a, b, step, empty());

  export const lengthSq = (self: Const<IVec3>): number => self.x * self.x + self.y * self.y + self.z * self.z;
  export const length = (self: Const<IVec3>): number => Math.sqrt(lengthSq(self));

  export const manhattanLength = (self: Const<IVec3>): number => Math.abs(self.x) + Math.abs(self.y) + Math.abs(self.z);

  export const dot = (a: Const<IVec3>, b: Const<IVec3>): number => a.x * b.x + a.y * b.y + a.z * b.z;

  export const fromArray = (array: Const<NumberArray>, offset: number): IVec3 => fromArray_(array, offset, empty());
  export const fromArray_ = (array: Const<NumberArray>, offset: number, into: IVec3): IVec3 => {
    console.log(array, offset, array[offset], array[offset + 1], array[offset + 2]);

    return set(into, array[offset], array[offset + 1], array[offset + 2]);
  };
  export const fillArray = (self: IVec3, array: Const<NumberArray>, offset: number): IVec3 =>
    fromArray_(array, offset, self);
  export const intoArray_ = <T extends NumberArray>({ x, y, z }: Const<IVec3>, offset: number, into: T): T => {
    into[offset] = x;
    into[offset + 1] = y;
    into[offset + 2] = z;

    return into;
  };
  export const intoArray = (self: Const<IVec3>): number[] => intoArray_(self, 0, [0, 0, 0]);

  export const fromAttribute = (attribute: Const<BufferAttribute>, index: number): IVec3 =>
    fromAttribute_(attribute, index, empty());
  export const fromAttribute_ = (attribute: Const<BufferAttribute>, index: number, into: IVec3): IVec3 =>
    set(into, attribute.getX(index), attribute.getY(index), attribute.getZ(index));
  export const fillAttribute = (self: IVec3, attribute: Const<BufferAttribute>, index: number): IVec3 =>
    fromAttribute_(attribute, index, self);
  export const intoAttribute_ = (self: Const<IVec3>, index: number, into: BufferAttribute): BufferAttribute =>
    into.setXYZ(index, self.x, self.y, self.z);

  export const fromSpherical = (spherical: Const<Spherical>): IVec3 => fromSpherical_(spherical, empty());
  export const fromSpherical_ = ({ phi, radius, theta }: Const<Spherical>, into: IVec3): IVec3 => {
    const phiSinRadius = Math.sin(phi) * radius;

    return set(into, phiSinRadius * Math.sin(theta), Math.cos(phi), phiSinRadius * Math.cos(theta));
  };
  export const fillSpherical = (self: IVec3, spherical: Const<Spherical>): IVec3 => fromSpherical_(spherical, self);

  export const fromCylindrical = (cylindrical: Const<Cylindrical>): IVec3 => fromCylindrical_(cylindrical, empty());
  export const fromCylindrical_ = ({ radius, theta, y }: Const<Cylindrical>, into: IVec3): IVec3 =>
    set(into, radius * Math.sin(theta), y, radius * Math.cos(theta));
  export const fillCylindrical = (self: IVec3, cylindrical: Const<Cylindrical>): IVec3 =>
    fromCylindrical_(cylindrical, self);

  export const fromMat4Position = (matrix: Const<Matrix4>): IVec3 => fromMat4Position_(matrix, empty());
  export const fromMat4Position_ = ({ elements }: Const<Matrix4>, into: IVec3): IVec3 =>
    set(into, elements[12], elements[13], elements[14]);
  export const fillMat4Position = (self: IVec3, matrix: Const<Matrix4>): IVec3 => fromMat4Position_(matrix, self);

  export const fromMat4Column = (matrix: Const<Matrix4>, index: 0 | 1 | 2 | 3 | number): IVec3 =>
    fromMat4Column_(matrix, index, empty());
  export const fromMat4Column_ = ({ elements }: Const<Matrix4>, index: number, into: IVec3): IVec3 =>
    fillArray(into, elements, index * 4);
  export const fillMat4Column = (self: IVec3, matrix: Const<Matrix4>, index: 0 | 1 | 2 | 3 | number): IVec3 =>
    fromMat4Column_(matrix, index, self);

  export const fromMat3Column = (matrix: Const<Matrix3>, index: 0 | 1 | 2 | number): IVec3 =>
    fromMat3Column_(matrix, index, empty());
  export const fromMat3Column_ = ({ elements }: Const<Matrix3>, index: number, into: IVec3): IVec3 =>
    fillArray(into, elements, index * 3);
  export const fillMat3Column = (self: IVec3, matrix: Const<Matrix3>, index: 0 | 1 | 2 | number): IVec3 =>
    fromMat3Column_(matrix, index, self);

  export const fromMat4Scale = (matrix: Const<Matrix4>): IVec3 => fromMat4Scale_(matrix, empty());
  export const fromMat4Scale_ = (matrix: Const<Matrix4>, into: IVec3): IVec3 => {
    const sx = length(fillMat4Column(into, matrix, 0));
    const sy = length(fillMat4Column(into, matrix, 1));
    const sz = length(fillMat4Column(into, matrix, 2));

    return set(into, sx, sy, sz);
  };
  export const fillMat4Scale = (self: IVec3, matrix: Const<Matrix4>): IVec3 => fromMat4Scale_(matrix, self);

  export const fromEuler = (euler: Const<Euler>): IVec3 => fromEuler_(euler, empty());
  export const fromEuler_ = ({ x, y, z }: Const<Euler>, into: IVec3): IVec3 => set(into, x, y, z);
  export const fillEuler = (self: IVec3, euler: Const<Euler>): IVec3 => fromEuler_(euler, self);

  export const fromColor = (color: Const<Color>): IVec3 => fromColor_(color, empty());
  export const fromColor_ = ({ r, g, b }: Const<Color>, into: IVec3): IVec3 => set(into, r, g, b);
  export const fillColor = (self: IVec3, color: Const<Color>): IVec3 => fromColor_(color, self);

  export const distanceSqTo = (a: Const<IVec3>, b: Const<IVec3>): number => {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;

    return dx * dx + dy * dy + dz * dz;
  };
  export const distanceTo = (a: Const<IVec3>, b: Const<IVec3>): number => Math.sqrt(distanceSqTo(a, b));

  export const manhattanDistanceTo = (a: Const<IVec3>, b: Const<IVec3>): number =>
    Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.z - b.z);

  export const applyMat4 = (self: IVec3, matrix: Const<Matrix4>): IVec3 => applyMat4_(self, matrix, self);
  export const applyMat4_ = (self: Const<IVec3>, { elements: e }: Const<Matrix4>, into: IVec3): IVec3 => {
    const { x, y, z } = self;

    const w = 1 / (e[3] * x + e[7] * y + e[11] * z + e[15]);

    return set(
      into,
      (e[0] * x + e[4] * y + e[8] * z + e[12]) * w,
      (e[1] * x + e[5] * y + e[9] * z + e[13]) * w,
      (e[2] * x + e[6] * y + e[10] * z + e[14]) * w,
    );
  };
  export const appliedMat4 = (self: Const<IVec3>, matrix: Const<Matrix4>): IVec3 => applyMat4_(self, matrix, empty());

  export const applyMat3 = (self: IVec3, matrix: Const<Matrix3>): IVec3 => applyMat3_(self, matrix, self);
  export const applyMat3_ = (self: Const<IVec3>, { elements: e }: Const<Matrix3>, into: IVec3): IVec3 =>
    set(
      into,
      e[0] * self.x + e[3] * self.y + e[6] * self.z,
      e[1] * self.x + e[4] * self.y + e[7] * self.z,
      e[2] * self.x + e[5] * self.y + e[8] * self.z,
    );
  export const appliedMat3 = (self: Const<IVec3>, matrix: Const<Matrix3>): IVec3 => applyMat3_(self, matrix, empty());

  export const applyEuler = (self: IVec3, euler: Const<Euler>): IVec3 => applyEuler_(self, euler, self);
  export const applyEuler_ = (self: Const<IVec3>, { x, y, z }: Const<Euler>, into: IVec3): IVec3 => {
    const { cos, sin } = Math;

    const c1 = cos(z);
    const s1 = sin(z);
    const c2 = cos(y);
    const s2 = sin(y);
    const c3 = cos(x);
    const s3 = sin(x);

    return set(
      into,
      c1 * c2 * self.x - s1 * c2 * self.y + s2 * self.z,
      s1 * c3 * self.x + c1 * c3 * self.y - s3 * self.z,
      -c1 * s2 * self.x + s1 * s2 * self.y + c2 * self.z,
    );
  };

  export const applyQuaternion = (self: IVec3, quaternion: Const<Quaternion>): IVec3 =>
    applyQuaternion_(self, quaternion, self);
  export const applyQuaternion_ = (self: Const<IVec3>, quaternion: Const<Quaternion>, into: IVec3): IVec3 => {
    const { x, y, z, w } = quaternion;
    const tx = 2 * (y * self.z - z * self.y);
    const ty = 2 * (z * self.x - x * self.z);
    const tz = 2 * (x * self.y - y * self.x);

    return set(
      into,
      self.x + w * tx + y * tz - z * ty,
      self.y + w * ty + z * tx - x * tz,
      self.z + w * tz + x * ty - y * tx,
    );
  };

  const _quaternion: Quaternion = { x: 0, y: 0, z: 0, w: 0 };
  export const applyAxisAngle = (self: IVec3, axis: Const<IVec3>, angle: number): IVec3 =>
    applyAxisAngle_(self, axis, angle, self);
  export const applyAxisAngle_ = (self: Const<IVec3>, axis: Const<IVec3>, angle: number, into: IVec3): IVec3 => {
    Quaternion.fillAxisAngle(_quaternion, axis, angle);
    applyQuaternion_(self, _quaternion, into);
    return into;
  };

  export const applyNormalMatrix = (self: IVec3, matrix: Const<Matrix3>): IVec3 =>
    applyNormalMatrix_(self, matrix, self);
  export const applyNormalMatrix_ = (self: Const<IVec3>, matrix: Const<Matrix3>, into: IVec3): IVec3 =>
    normalize(applyMat3_(self, matrix, into));

  export const project = (self: IVec3, camera: Camera) => project_(self, camera, self);
  export const project_ = (self: Const<IVec3>, camera: Const<Camera>, into: IVec3): IVec3 => {
    applyMat4_(self, camera.matrixWorldInverse, into);
    applyMat4(into, camera.projectionMatrix);
    return into;
  };
  export const projected = (self: Const<IVec3>, camera: Const<Camera>): IVec3 => project_(self, camera, empty());

  export const unproject = (self: IVec3, camera: Camera) => unproject_(self, camera, self);
  export const unproject_ = (self: Const<IVec3>, camera: Const<Camera>, into: IVec3): IVec3 => {
    applyMat4_(self, camera.projectionMatrixInverse, into);
    applyMat4(into, camera.matrixWorld);
    return into;
  };
  export const unprojected = (self: Const<IVec3>, camera: Const<Camera>): IVec3 => unproject_(self, camera, empty());

  export const reflect = (self: IVec3, normal: Const<IVec3>): IVec3 => reflect_(self, normal, self);
  export const reflect_ = (self: Const<IVec3>, normal: Const<IVec3>, into: IVec3): IVec3 =>
    subScaled(into, normal, 2 * dot(self, normal));
  export const reflected = (self: Const<IVec3>, normal: Const<IVec3>): IVec3 => reflect_(self, normal, empty());

  export const projectVec = (self: IVec3, vector: Const<IVec3>): IVec3 => projectVec_(self, vector, self);
  export const projectVec_ = (self: Const<IVec3>, vector: Const<IVec3>, into: IVec3): IVec3 => {
    const denominator = lengthSq(vector);
    if (denominator === 0) return set(into, 0, 0, 0);

    const scalar = dot(vector, self) / denominator;

    return mulScalar_(vector, scalar, into);
  };
  export const projectedVec = (self: Const<IVec3>, vector: Const<IVec3>): IVec3 => projectVec_(self, vector, empty());

  export const projectPlane = (self: IVec3, normal: Const<IVec3>): IVec3 => projectPlane_(self, normal, self);
  export const projectPlane_ = (self: Const<IVec3>, normal: Const<IVec3>, into: IVec3): IVec3 =>
    subScaled(into, normal, dot(self, normal));
  export const projectedPlane = (self: Const<IVec3>, normal: Const<IVec3>): IVec3 =>
    projectPlane_(self, normal, empty());

  export const transformDirection = (self: IVec3, matrix: Const<Matrix4>): IVec3 =>
    transformDirection_(self, matrix, self);
  export const transformDirection_ = (self: Const<IVec3>, matrix: Const<Matrix4>, into: IVec3): IVec3 => {
    const { x, y, z } = self;
    const e = matrix.elements;

    return normalize(
      set(into, e[0] * x + e[4] * y + e[8] * z, e[1] * x + e[5] * y + e[9] * z, e[2] * x + e[6] * y + e[10] * z),
    );
  };

  export const angleTo = (a: Const<IVec3>, b: Const<IVec3>): number => {
    const square = lengthSq(a);
    const denominator = Math.sqrt(square * square);
    if (denominator === 0) return Math.PI / 2;

    const theta = dot(a, b) / denominator;
    return Math.acos(clampNumber(theta, -1, 1));
  };

  export const equals = (a: Const<IVec3>, b: Const<IVec3>): boolean => a.x === b.x && a.y === b.y && a.z === b.z;

  export const temp0 = empty();
  export const temp1 = empty();
  export const temp2 = empty();
  export const temp3 = empty();
  export const temp4 = empty();
  export const temp5 = empty();
  export const temp6 = empty();
  export const temp7 = empty();
  export const temp8 = empty();
  export const temp9 = empty();
}
