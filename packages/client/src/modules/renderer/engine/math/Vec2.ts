import { clamp } from './MathUtils.js';
import type { BufferAttribute } from '../core/BufferAttribute.js';
import type { Mat3 } from './Mat3.js';
import { Attribute } from '@modules/renderer/engine/core/types.js';
import { Const } from '@modules/renderer/engine/math/types.js';

export interface IVec2 {
  x: number;
  y: number;
}

export class Vec2 implements IVec2 {
  declare isVec2: true;
  declare ['constructor']: typeof Vec2;

  constructor(
    public x: number = 0,
    public y: number = 0,
  ) {}

  static new(x: number = 0, y: number = 0): Vec2 {
    return new Vec2(x, y);
  }

  static scalar(scalar: number, into: Vec2 = Vec2.new()): Vec2 {
    return into.setScalar(scalar);
  }

  static empty(): Vec2 {
    return Vec2.new(0, 0);
  }

  static clone({ x, y }: Const<Vec2>, into: Vec2 = Vec2.new()): Vec2 {
    return into.set(x, y);
  }

  static is(vec: any): vec is Vec2 {
    return vec?.isVec2 === true;
  }

  static into(into: Vec2, { x, y }: Const<Vec2>) {
    return into.set(x, y);
  }

  static from({ x, y }: Const<Vec2>, into: Vec2 = Vec2.new()): Vec2 {
    return into.set(x, y);
  }

  static fromAttribute(attribute: Attribute, index: number, into: Vec2 = Vec2.new()): Vec2 {
    return into.fromAttribute(attribute, index);
  }

  static fromArray(array: number[], offset: number = 0, into: Vec2 = Vec2.new()): Vec2 {
    return into.fromArray(array, offset);
  }

  static lerp(from: Const<Vec2>, to: Const<Vec2>, step: number, into: Vec2 = Vec2.new()): Vec2 {
    return into.lerp(from, to, step);
  }

  get width(): number {
    return this.x;
  }

  set width(value: number) {
    this.x = value;
  }

  get height(): number {
    return this.y;
  }

  set height(value: number) {
    this.y = value;
  }

  set(x: number, y: number): this {
    this.x = x;
    this.y = y;

    return this;
  }

  setScalar(scalar: number) {
    this.x = scalar;
    this.y = scalar;

    return this;
  }

  setX(x: number) {
    this.x = x;

    return this;
  }

  setY(y: number) {
    this.y = y;

    return this;
  }

  setComponent(index: 0 | 1, value: number): this {
    switch (index) {
      case 0:
        this.x = value;
        break;
      case 1:
        this.y = value;
        break;
      default:
        throw new Error(`index is out of range: ${index}`);
    }

    return this;
  }

  getComponent(index: 0 | 1): number {
    switch (index) {
      case 0:
        return this.x;
      case 1:
        return this.y;
      default:
        throw new Error(`index is out of range: ${index}`);
    }
  }

  clone(): Vec2 {
    return new this.constructor(this.x, this.y);
  }

  copy(v: Vec2): this {
    this.x = v.x;
    this.y = v.y;

    return this;
  }

  add(vector: Vec2): this {
    this.x += vector.x;
    this.y += vector.y;

    return this;
  }

  addScalar(scalar: number): this {
    this.x += scalar;
    this.y += scalar;

    return this;
  }

  addVectors(a: Vec2, b: Vec2): this {
    this.x = a.x + b.x;
    this.y = a.y + b.y;

    return this;
  }

  addScaledVector(vector: Vec2, scale: number): this {
    this.x += vector.x * scale;
    this.y += vector.y * scale;

    return this;
  }

  sub(vector: Vec2): this {
    this.x -= vector.x;
    this.y -= vector.y;

    return this;
  }

  subScalar(scalar: number): this {
    this.x -= scalar;
    this.y -= scalar;

    return this;
  }

  subVectors(a: Vec2, b: Vec2): this {
    this.x = a.x - b.x;
    this.y = a.y - b.y;

    return this;
  }

  multiply(vector: Vec2): this {
    this.x *= vector.x;
    this.y *= vector.y;

    return this;
  }

  multiplyScalar(scalar: number): this {
    this.x *= scalar;
    this.y *= scalar;

    return this;
  }

  divide(vector: Vec2): this {
    this.x /= vector.x;
    this.y /= vector.y;

    return this;
  }

  divideScalar(scalar: number): this {
    return this.multiplyScalar(1 / scalar);
  }

  applyMat3(matrix: Mat3): this {
    const x = this.x,
      y = this.y;
    const e = matrix.elements;

    this.x = e[0] * x + e[3] * y + e[6];
    this.y = e[1] * x + e[4] * y + e[7];

    return this;
  }

  min(vector: Vec2): this {
    this.x = Math.min(this.x, vector.x);
    this.y = Math.min(this.y, vector.y);

    return this;
  }

  max(vector: Vec2): this {
    this.x = Math.max(this.x, vector.x);
    this.y = Math.max(this.y, vector.y);

    return this;
  }

  clamp(min: Vec2, max: Vec2): this {
    // assumes min < max, componentwise

    this.x = Math.max(min.x, Math.min(max.x, this.x));
    this.y = Math.max(min.y, Math.min(max.y, this.y));

    return this;
  }

  clampScalar(min: number, max: number): this {
    this.x = Math.max(min, Math.min(max, this.x));
    this.y = Math.max(min, Math.min(max, this.y));

    return this;
  }

  clampLength(min: number, max: number): this {
    const length = this.length();

    return this.divideScalar(length || 1).multiplyScalar(Math.max(min, Math.min(max, length)));
  }

  floor(): this {
    this.x = Math.floor(this.x);
    this.y = Math.floor(this.y);

    return this;
  }

  ceil(): this {
    this.x = Math.ceil(this.x);
    this.y = Math.ceil(this.y);

    return this;
  }

  round(): this {
    this.x = Math.round(this.x);
    this.y = Math.round(this.y);

    return this;
  }

  roundToZero(): this {
    this.x = Math.trunc(this.x);
    this.y = Math.trunc(this.y);

    return this;
  }

  negate(): this {
    this.x = -this.x;
    this.y = -this.y;

    return this;
  }

  dot(v: Vec2): number {
    return this.x * v.x + this.y * v.y;
  }

  cross(v: Vec2): number {
    return this.x * v.y - this.y * v.x;
  }

  lengthSq(): number {
    return this.x * this.x + this.y * this.y;
  }

  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  manhattanLength(): number {
    return Math.abs(this.x) + Math.abs(this.y);
  }

  normalize(): this {
    return this.divideScalar(this.length() || 1);
  }

  angle(): number {
    return Math.atan2(-this.y, -this.x) + Math.PI;
  }

  angleTo(vector: Vec2): number {
    const denominator = Math.sqrt(this.lengthSq() * vector.lengthSq());

    if (denominator === 0) return Math.PI / 2;

    const theta = this.dot(vector) / denominator;

    // clamp, to handle numerical problems

    return Math.acos(clamp(theta, -1, 1));
  }

  distanceTo(vector: Vec2): number {
    return Math.sqrt(this.distanceToSquared(vector));
  }

  distanceToSquared(v: Vec2): number {
    const dx = this.x - v.x,
      dy = this.y - v.y;
    return dx * dx + dy * dy;
  }

  manhattanDistanceTo(v: Vec2): number {
    return Math.abs(this.x - v.x) + Math.abs(this.y - v.y);
  }

  setLength(length: number): this {
    return this.normalize().multiplyScalar(length);
  }

  lerp(vector: Vec2, step: number): this {
    this.x += (vector.x - this.x) * step;
    this.y += (vector.y - this.y) * step;

    return this;
  }

  lerpVectors(v1: Vec2, v2: Vec2, step: number): this {
    this.x = v1.x + (v2.x - v1.x) * step;
    this.y = v1.y + (v2.y - v1.y) * step;

    return this;
  }

  equals(vector: Vec2) {
    return vector.x === this.x && vector.y === this.y;
  }

  fromArray(array: number[], offset: number = 0): this {
    this.x = array[offset];
    this.y = array[offset + 1];

    return this;
  }

  toArray(array: number[] = [], offset: number = 0): number[] {
    array[offset] = this.x;
    array[offset + 1] = this.y;

    return array;
  }

  fromBufferAttribute(attribute: BufferAttribute, index: number): this {
    this.x = attribute.getX(index);
    this.y = attribute.getY(index);

    return this;
  }

  rotateAround(center: Vec2, angle: number): this {
    const c = Math.cos(angle),
      s = Math.sin(angle);

    const x = this.x - center.x;
    const y = this.y - center.y;

    this.x = x * c - y * s + center.x;
    this.y = x * s + y * c + center.y;

    return this;
  }

  random(): this {
    this.x = Math.random();
    this.y = Math.random();

    return this;
  }

  *[Symbol.iterator](): Iterator<number> {
    yield this.x;
    yield this.y;
  }
}
Vec2.prototype.isVec2 = true;
