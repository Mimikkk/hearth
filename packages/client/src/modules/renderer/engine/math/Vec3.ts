import { clamp, NumberArray } from './MathUtils.js';
import { Quaternion } from './Quaternion.js';
import type { Color } from '@modules/renderer/engine/math/Color.js';
import type { Euler } from '@modules/renderer/engine/math/Euler.js';
import type { Mat3 } from '@modules/renderer/engine/math/Mat3.js';
import type { Mat4 } from '@modules/renderer/engine/math/Mat4.js';
import type { Cylindrical } from '@modules/renderer/engine/math/Cylindrical.js';
import type { Spherical } from '@modules/renderer/engine/math/Spherical.js';
import type { Camera } from '@modules/renderer/engine/objects/cameras/Camera.js';
import type { Const } from '@modules/renderer/engine/math/types.js';
import { BufferAttribute } from '@modules/renderer/engine/core/BufferAttribute.js';

export class Vec3 {
  declare isVec3: true;

  constructor(
    public x: number = 0,
    public y: number = 0,
    public z: number = 0,
  ) {}

  static new(x: number = 0, y: number = 0, z: number = 0): Vec3 {
    return new Vec3(x, y, z);
  }

  static scalar(scalar: number, into: Vec3 = Vec3.new()): Vec3 {
    return into.setScalar(scalar);
  }

  static empty(): Vec3 {
    return Vec3.new(0, 0);
  }

  static clone({ x, y, z }: Const<Vec3>, into: Vec3 = Vec3.new()): Vec3 {
    return into.set(x, y, z);
  }

  static is(vec: any): vec is Vec3 {
    return vec?.isVec3 === true;
  }

  static into(into: Vec3, { x, y, z }: Const<Vec3>) {
    return into.set(x, y, z);
  }

  static from({ x, y, z }: Const<Vec3>, into: Vec3 = Vec3.new()): Vec3 {
    return into.set(x, y, z);
  }

  static fromAttribute(attribute: Const<BufferAttribute>, index: number, into: Vec3 = Vec3.new()): Vec3 {
    return into.fromAttribute(attribute, index);
  }

  static fromArray(array: Const<NumberArray>, offset: number = 0, into: Vec3 = Vec3.new()): Vec3 {
    return into.fromArray(array, offset);
  }

  static fromColor(color: Const<Color>, into: Vec3 = Vec3.new()): Vec3 {
    return into.fromColor(color);
  }

  static fromEuler(euler: Const<Euler>, into: Vec3 = Vec3.new()): Vec3 {
    return into.fromEuler(euler);
  }

  static fromSpherical(spherical: Const<Spherical>, into: Vec3 = Vec3.new()): Vec3 {
    return into.fromSpherical(spherical);
  }

  static fromCylindrical(cylindrical: Const<Cylindrical>, into: Vec3 = Vec3.new()): Vec3 {
    return into.fromCylindrical(cylindrical);
  }

  static fromMat4Position(mat: Const<Mat4>, into: Vec3 = Vec3.new()): Vec3 {
    return into.fromMat4Position(mat);
  }

  static fromMat4Scale(mat: Const<Mat4>, into: Vec3 = Vec3.new()): Vec3 {
    return into.fromMat4Scale(mat);
  }

  static fromMat4Column(mat: Const<Mat4>, index: number, into: Vec3 = Vec3.new()): Vec3 {
    return into.fromMat4Column(mat, index);
  }

  static fromMat3Column(matrix: Const<Mat3>, index: number, into: Vec3 = Vec3.new()): Vec3 {
    return into.fromMat3Column(matrix, index);
  }

  static lerp(from: Const<Vec3>, to: Const<Vec3>, step: number, into: Vec3 = Vec3.new()): Vec3 {
    return into.asLerp(from, to, step);
  }

  clone(into: Vec3 = Vec3.new()): Vec3 {
    return into.from(this);
  }

  set(x: number, y: number, z: number): this {
    this.x = x;
    this.y = y;
    this.z = z;

    return this;
  }

  setScalar(scalar: number): this {
    return this.set(scalar, scalar, scalar);
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

  from({ x, y, z }: Const<Vec3>): this {
    return this.set(x, y, z);
  }

  add(v: Const<Vec3>): this {
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

  addScaled(vector: Const<Vec3>, scale: number): this {
    this.x += vector.x * scale;
    this.y += vector.y * scale;
    this.z += vector.z * scale;

    return this;
  }

  asAdd(a: Const<Vec3>, b: Const<Vec3>): this {
    this.x = a.x + b.x;
    this.y = a.y + b.y;
    this.z = a.z + b.z;

    return this;
  }

  sub(vector: Const<Vec3>): this {
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

  subScaled(vector: Const<Vec3>, scale: number): this {
    this.x -= vector.x * scale;
    this.y -= vector.y * scale;
    this.z -= vector.z * scale;

    return this;
  }

  asSub(a: Const<Vec3>, b: Const<Vec3>): this {
    this.x = a.x - b.x;
    this.y = a.y - b.y;
    this.z = a.z - b.z;

    return this;
  }

  mul(vector: Const<Vec3>): this {
    this.x *= vector.x;
    this.y *= vector.y;
    this.z *= vector.z;

    return this;
  }

  scale(scalar: number): this {
    this.x *= scalar;
    this.y *= scalar;
    this.z *= scalar;

    return this;
  }

  asMul(a: Const<Vec3>, b: Const<Vec3>): this {
    this.x = a.x * b.x;
    this.y = a.y * b.y;
    this.z = a.z * b.z;

    return this;
  }

  applyEuler(euler: Const<Euler>): this {
    return this.applyQuaternion(Quaternion.fromEuler(euler));
  }

  applyAxisAngle(axis: Const<Vec3>, angle: number): this {
    return this.applyQuaternion(Quaternion.fromAxisAngle(axis, angle));
  }

  applyMat3(matrix: Const<Mat3>): this {
    const x = this.x,
      y = this.y,
      z = this.z;
    const e = matrix.elements;

    this.x = e[0] * x + e[3] * y + e[6] * z;
    this.y = e[1] * x + e[4] * y + e[7] * z;
    this.z = e[2] * x + e[5] * y + e[8] * z;

    return this;
  }

  applyNMat3(matrix: Const<Mat3>): this {
    return this.applyMat3(matrix).normalize();
  }

  applyMat4(matrix: Const<Mat4>): this {
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

  applyQuaternion(quaternion: Const<Quaternion>): this {
    // quaternion q is assumed to have unit length

    const vx = this.x,
      vy = this.y,
      vz = this.z;
    const qx = quaternion.x,
      qy = quaternion.y,
      qz = quaternion.z,
      qw = quaternion.w;

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

  project(camera: Const<Camera>): this {
    return this.applyMat4(camera.matrixWorldInverse).applyMat4(camera.projectionMatrix);
  }

  unproject(camera: Const<Camera>): this {
    return this.applyMat4(camera.projectionMatrixInverse).applyMat4(camera.matrixWorld);
  }

  transformDirection(affine: Const<Mat4>): this {
    // input: engine.Mat4 affine matrix
    // vector interpreted as a direction

    const x = this.x,
      y = this.y,
      z = this.z;
    const e = affine.elements;

    this.x = e[0] * x + e[4] * y + e[8] * z;
    this.y = e[1] * x + e[5] * y + e[9] * z;
    this.z = e[2] * x + e[6] * y + e[10] * z;

    return this.normalize();
  }

  div(vector: Const<Vec3>): this {
    this.x /= vector.x;
    this.y /= vector.y;
    this.z /= vector.z;

    return this;
  }

  divScalar(scalar: number): this {
    return this.scale(1 / scalar);
  }

  min(vector: Const<Vec3>): this {
    this.x = Math.min(this.x, vector.x);
    this.y = Math.min(this.y, vector.y);
    this.z = Math.min(this.z, vector.z);

    return this;
  }

  max(vector: Const<Vec3>): this {
    this.x = Math.max(this.x, vector.x);
    this.y = Math.max(this.y, vector.y);
    this.z = Math.max(this.z, vector.z);

    return this;
  }

  clamp(min: Const<Vec3>, max: Const<Vec3>): this {
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

    return this.divScalar(length || 1).scale(Math.max(min, Math.min(max, length)));
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

  truncate(): this {
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

  dot(vector: Const<Vec3>): number {
    return this.x * vector.x + this.y * vector.y + this.z * vector.z;
  }

  lengthSq(): number {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }

  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  manhattan(): number {
    return Math.abs(this.x) + Math.abs(this.y) + Math.abs(this.z);
  }

  normalize(): this {
    return this.divScalar(this.length() || 1);
  }

  setLength(length: number): this {
    return this.normalize().scale(length);
  }

  lerp(vector: Const<Vec3>, step: number): this {
    this.x += (vector.x - this.x) * step;
    this.y += (vector.y - this.y) * step;
    this.z += (vector.z - this.z) * step;

    return this;
  }

  asLerp(from: Const<Vec3>, to: Const<Vec3>, step: number): this {
    this.x = from.x + (to.x - from.x) * step;
    this.y = from.y + (to.y - from.y) * step;
    this.z = from.z + (to.z - from.z) * step;

    return this;
  }

  cross(vector: Vec3): this {
    return this.asCross(this, vector);
  }

  asCross(a: Const<Vec3>, b: Const<Vec3>): this {
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

  projectOnVec(vector: Const<Vec3>): this {
    const denominator = vector.lengthSq();

    if (denominator === 0) return this.set(0, 0, 0);

    const scalar = vector.dot(this) / denominator;

    return this.from(vector).scale(scalar);
  }

  projectOnPlane(normal: Const<Vec3>): this {
    return this.sub(this.clone().projectOnVec(normal));
  }

  reflect(normal: Const<Vec3>): this {
    return this.sub(normal.clone().scale(2 * this.dot(normal)));
  }

  angleTo(vector: Const<Vec3>): number {
    const denominator = Math.sqrt(this.lengthSq() * vector.lengthSq());

    if (denominator === 0) return Math.PI / 2;

    const theta = this.dot(vector) / denominator;

    // clamp, to handle numerical problems

    return Math.acos(clamp(theta, -1, 1));
  }

  distanceTo(vector: Const<Vec3>): number {
    return Math.sqrt(this.distanceSqTo(vector));
  }

  distanceSqTo(vector: Const<Vec3>): number {
    const dx = this.x - vector.x,
      dy = this.y - vector.y,
      dz = this.z - vector.z;

    return dx * dx + dy * dy + dz * dz;
  }

  manhattanTo(vector: Const<Vec3>): number {
    return Math.abs(this.x - vector.x) + Math.abs(this.y - vector.y) + Math.abs(this.z - vector.z);
  }

  fromSpherical(spherical: Const<Spherical>): this {
    return this.fromSphericalCoords(spherical.radius, spherical.phi, spherical.theta);
  }

  fromSphericalCoords(radius: number, phi: number, theta: number): this {
    const sinPhiRadius = Math.sin(phi) * radius;

    this.x = sinPhiRadius * Math.sin(theta);
    this.y = Math.cos(phi) * radius;
    this.z = sinPhiRadius * Math.cos(theta);

    return this;
  }

  fromCylindrical(cylindrical: Const<Cylindrical>): this {
    return this.fromCylindricalCoords(cylindrical.radius, cylindrical.theta, cylindrical.height);
  }

  fromCylindricalCoords(radius: number, theta: number, y: number): this {
    this.x = radius * Math.sin(theta);
    this.y = y;
    this.z = radius * Math.cos(theta);

    return this;
  }

  fromMat4Position(matrix: Const<Mat4>): this {
    const e = matrix.elements;

    this.x = e[12];
    this.y = e[13];
    this.z = e[14];

    return this;
  }

  fromMat4Scale(matrix: Const<Mat4>): this {
    const sx = this.fromMat4Column(matrix, 0).length();
    const sy = this.fromMat4Column(matrix, 1).length();
    const sz = this.fromMat4Column(matrix, 2).length();

    this.x = sx;
    this.y = sy;
    this.z = sz;

    return this;
  }

  fromMat4Column(matrix: Const<Mat4>, index: number): this {
    return this.fromArray(matrix.elements, index * 4);
  }

  fromMat3Column(matrix: Const<Mat3>, index: number): this {
    return this.fromArray(matrix.elements, index * 3);
  }

  fromEuler(euler: Const<Euler>): this {
    this.x = euler.x;
    this.y = euler.y;
    this.z = euler.z;

    return this;
  }

  fromColor(color: Const<Color>): this {
    this.x = color.r;
    this.y = color.g;
    this.z = color.b;

    return this;
  }

  fromArray(array: Const<NumberArray>, offset = 0): this {
    this.x = array[offset];
    this.y = array[offset + 1];
    this.z = array[offset + 2];

    return this;
  }

  intoArray<T extends NumberArray>(array: T = [] as never, offset: number = 0): T {
    array[offset] = this.x;
    array[offset + 1] = this.y;
    array[offset + 2] = this.z;

    return array;
  }

  fromAttribute(attribute: Const<BufferAttribute>, index: number): this {
    return this.set(attribute.getX(index), attribute.getY(index), attribute.getZ(index));
  }

  intoAttribute(attribute: BufferAttribute, index: number): this {
    attribute.setXYZ(index, this.x, this.y, this.z);
    return this;
  }

  equals(vector: Const<Vec3>): boolean {
    return vector.x === this.x && vector.y === this.y && vector.z === this.z;
  }

  *[Symbol.iterator](): Iterator<number> {
    yield this.x;
    yield this.y;
    yield this.z;
  }
}

Vec3.prototype.isVec3 = true;
