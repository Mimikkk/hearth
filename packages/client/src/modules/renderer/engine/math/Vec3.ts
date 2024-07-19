import { clamp, type NumberArray } from './MathUtils.js';
import { Quaternion } from './Quaternion.js';
import type { Color } from '@modules/renderer/engine/math/Color.js';
import type { Euler } from '@modules/renderer/engine/math/Euler.js';
import type { Mat3 } from '@modules/renderer/engine/math/Mat3.js';
import type { Mat4 } from '@modules/renderer/engine/math/Mat4.js';
import type { Cylindrical } from '@modules/renderer/engine/math/Cylindrical.js';
import type { Spherical } from '@modules/renderer/engine/math/Spherical.js';
import type { Camera } from '@modules/renderer/engine/cameras/Camera.js';
import type { Const } from '@modules/renderer/engine/math/types.js';
import type { Attribute } from '@modules/renderer/engine/core/Attribute.js';

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

  static fromAttribute(attribute: Const<Attribute>, index: number, into: Vec3 = Vec3.new()): Vec3 {
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
    return into.lerp(from, to, step);
  }

  from({ x, y, z }: Const<Vec3>): this {
    return this.set(x, y, z);
  }

  clone() {
    return Vec3.from(this);
  }

  fill(into: Vec3): void {
    into.x = this.x;
    into.y = this.y;
    into.z = this.z;
  }

  fromAttribute(attribute: Const<Attribute>, index: number): this {
    return this.set(attribute.getX(index), attribute.getY(index), attribute.getZ(index));
  }

  fillAttribute(attribute: Attribute, index: number): this {
    attribute.setXYZ(index, this.x, this.y, this.z);
    return this;
  }

  fromArray(array: Const<NumberArray>, offset: number = 0): this {
    return this.set(array[offset], array[offset + 1], array[offset + 2]);
  }

  intoArray<T extends NumberArray = number[]>(array: T = [] as never, offset: number = 0): T {
    array[offset] = this.x;
    array[offset + 1] = this.y;
    array[offset + 2] = this.z;
    return array;
  }

  fromColor(color: Const<Color>): this {
    return this.set(color.r, color.g, color.b);
  }

  fromEuler(euler: Const<Euler>): this {
    return this.set(euler.x, euler.y, euler.z);
  }

  fromSpherical({ radius, theta, phi }: Const<Spherical>): this {
    const sinPhiRadius = Math.sin(phi) * radius;

    return this.set(sinPhiRadius * Math.sin(theta), Math.cos(phi) * radius, sinPhiRadius * Math.cos(theta));
  }

  fromCylindrical({ radius, theta, height }: Const<Cylindrical>): this {
    return this.set(radius * Math.sin(theta), height, radius * Math.cos(theta));
  }

  fromMat4Position({ elements: e }: Const<Mat4>): this {
    return this.set(e[12], e[13], e[14]);
  }

  fromMat4Scale(matrix: Const<Mat4>): this {
    return this.set(
      this.fromMat4Column(matrix, 0).length(),
      this.fromMat4Column(matrix, 1).length(),
      this.fromMat4Column(matrix, 2).length(),
    );
  }

  fromMat4Column({ elements: e }: Const<Mat4>, index: number): this {
    return this.fromArray(e, index * 4);
  }

  fromMat3Column({ elements: e }: Const<Mat3>, index: number): this {
    return this.fromArray(e, index * 3);
  }

  set(x: number, y: number, z: number): this {
    this.x = x;
    this.y = y;
    this.z = z;
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

  setScalar(scalar: number): this {
    return this.set(scalar, scalar, scalar);
  }

  scale(scalar: number): this {
    return this.set(this.x * scalar, this.y * scalar, this.z * scalar);
  }

  div({ x, y, z }: Const<Vec3>): this {
    return this.set(this.x / x, this.y / y, this.z / z);
  }

  divScalar(scalar: number): this {
    return this.set(this.x / scalar, this.y / scalar, this.z / scalar);
  }

  mul({ x, y, z }: Const<Vec3>): this {
    return this.set(this.x * x, this.y * y, this.z * z);
  }

  mulScalar(scalar: number): this {
    return this.set(this.x * scalar, this.y * scalar, this.z * scalar);
  }

  add({ x, y, z }: Const<Vec3>): this {
    return this.set(this.x + x, this.y + y, this.z + z);
  }

  addScalar(scalar: number): this {
    return this.set(this.x + scalar, this.y + scalar, this.z + scalar);
  }

  addScaled({ x, y, z }: Const<Vec3>, scalar: number): this {
    return this.set(this.x + x * scalar, this.y + y * scalar, this.z + z * scalar);
  }

  sub({ x, y, z }: Const<Vec3>): this {
    return this.set(this.x - x, this.y - y, this.z - z);
  }

  subScalar(scalar: number): this {
    return this.set(this.x - scalar, this.y - scalar, this.z - scalar);
  }

  subScaled({ x, y, z }: Const<Vec3>, scalar: number): this {
    return this.set(this.x - x * scalar, this.y - y * scalar, this.z - z * scalar);
  }

  min({ x, y, z }: Const<Vec3>): this {
    return this.set(Math.min(this.x, x), Math.min(this.y, y), Math.min(this.z, z));
  }

  max({ x, y, z }: Const<Vec3>): this {
    return this.set(Math.max(this.x, x), Math.max(this.y, y), Math.max(this.z, z));
  }

  equals({ x, y, z }: Const<Vec3>): boolean {
    return this.x === x && this.y === y && this.z === z;
  }

  clamp(min: Const<Vec3>, max: Const<Vec3>): this {
    return this.set(clamp(this.x, min.x, max.x), clamp(this.y, min.y, max.y), clamp(this.z, min.z, max.z));
  }

  clampScalar(min: number, max: number): this {
    return this.set(clamp(this.x, min, max), clamp(this.y, min, max), clamp(this.z, min, max));
  }

  clampLength(min: number, max: number): this {
    return this.normalize().scale(clamp(this.euclidean(), min, max));
  }

  floor(): this {
    return this.set(Math.floor(this.x), Math.floor(this.y), Math.floor(this.z));
  }

  ceil(): this {
    return this.set(Math.ceil(this.x), Math.ceil(this.y), Math.ceil(this.z));
  }

  round(): this {
    return this.set(Math.round(this.x), Math.round(this.y), Math.round(this.z));
  }

  truncate(): this {
    return this.set(Math.trunc(this.x), Math.trunc(this.y), Math.trunc(this.z));
  }

  negate(): this {
    return this.set(-this.x, -this.y, -this.z);
  }

  dot({ x, y, z }: Const<Vec3>): number {
    return this.x * x + this.y * y + this.z * z;
  }

  cross({ x, y, z }: Const<Vec3>): this {
    return this.set(this.y * z - this.z * y, this.z * x - this.x * z, this.x * y - this.y * x);
  }

  euclideanSq(): number {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }

  euclidean(): number {
    return Math.sqrt(this.euclideanSq());
  }

  lengthSq(): number {
    return this.euclideanSq();
  }

  length(): number {
    return Math.sqrt(this.lengthSq());
  }

  manhattan(): number {
    return Math.abs(this.x) + Math.abs(this.y) + Math.abs(this.z);
  }

  normalize(): this {
    return this.divScalar(this.euclidean() || 1);
  }

  euclideanSqTo({ x, y, z }: Const<Vec3>): number {
    const dx = this.x - x;
    const dy = this.y - y;
    const dz = this.z - z;

    return dx * dx + dy * dy + dz * dz;
  }

  euclideanTo(to: Const<Vec3>): number {
    return Math.sqrt(this.euclideanSqTo(to));
  }

  distanceTo(to: Const<Vec3>): number {
    return this.euclideanTo(to);
  }

  distanceSqTo(to: Const<Vec3>): number {
    return this.euclideanSqTo(to);
  }

  manhattanTo({ x, y, z }: Const<Vec3>): number {
    return Math.abs(this.x - x) + Math.abs(this.y - y) + Math.abs(this.z - z);
  }

  setLength(length: number): this {
    return this.normalize().scale(length);
  }

  applyMat3({ elements: e }: Const<Mat3>): this {
    return this.set(
      e[0] * this.x + e[3] * this.y + e[6] * this.z,
      e[1] * this.x + e[4] * this.y + e[7] * this.z,
      e[2] * this.x + e[5] * this.y + e[8] * this.z,
    );
  }

  applyNMat3(mat: Const<Mat3>): this {
    return this.applyMat3(mat).normalize();
  }

  applyMat4({ elements: e }: Const<Mat4>): this {
    const { x, y, z } = this;
    const w = 1 / (e[3] * x + e[7] * y + e[11] * z + e[15]);

    return this.set(
      (e[0] * x + e[4] * y + e[8] * z + e[12]) * w,
      (e[1] * x + e[5] * y + e[9] * z + e[13]) * w,
      (e[2] * x + e[6] * y + e[10] * z + e[14]) * w,
    );
  }

  applyNMat4(mat: Const<Mat4>): this {
    return this.applyMat4(mat).normalize();
  }

  applyAxisAngle(axis: Const<Vec3>, angle: number): this {
    return this.applyQuaternion(Quaternion.fromAxisAngle(axis, angle));
  }

  applyEuler(euler: Const<Euler>): this {
    return this.applyQuaternion(Quaternion.fromEuler(euler));
  }

  applyQuaternion({ w: qw, x: qx, y: qy, z: qz }: Const<Quaternion>): this {
    const { x, y, z } = this;

    const tx = 2 * (qy * z - qz * y);
    const ty = 2 * (qz * x - qx * z);
    const tz = 2 * (qx * y - qy * x);

    return this.set(x + qw * tx + qy * tz - qz * ty, y + qw * ty + qz * tx - qx * tz, z + qw * tz + qx * ty - qy * tx);
  }

  project(camera: Const<Camera>): this {
    return this.applyMat4(camera.matrixWorldInverse).applyMat4(camera.projectionMatrix);
  }

  unproject(camera: Const<Camera>): this {
    return this.applyMat4(camera.projectionMatrixInverse).applyMat4(camera.matrixWorld);
  }

  transformDirection({ elements: e }: Const<Mat4>): this {
    const { x, y, z } = this;

    return this.set(
      e[0] * x + e[4] * y + e[8] * z,
      e[1] * x + e[5] * y + e[9] * z,
      e[2] * x + e[6] * y + e[10] * z,
    ).normalize();
  }

  projectOnVec(vec: Const<Vec3>): this {
    const scalar = vec.dot(this) / vec.lengthSq();

    return this.from(vec).scale(scalar);
  }

  projectOnPlane(normal: Const<Vec3>): this {
    return this.sub(Vec3.from(this).projectOnVec(normal));
  }

  reflect(normal: Const<Vec3>): this {
    return this.sub(Vec3.from(normal).scale(2 * this.dot(normal)));
  }

  angleTo(vec: Const<Vec3>): number {
    const denominator = Math.sqrt(this.lengthSq() * vec.lengthSq());
    const theta = this.dot(vec) / denominator;

    return Math.acos(clamp(theta, -1, 1));
  }

  lerp(from: Const<Vec3>, to: Const<Vec3>, step: number): this {
    return this.set(from.x + (to.x - from.x) * step, from.y + (to.y - from.y) * step, from.z + (to.z - from.z) * step);
  }

  *[Symbol.iterator](): Iterator<number> {
    yield this.x;
    yield this.y;
    yield this.z;
  }
}

Vec3.prototype.isVec3 = true;
