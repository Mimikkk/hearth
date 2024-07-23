import { clamp, type NumberArray } from './MathUtils.js';
import type { Mat3 } from './Mat3.js';
import type { AttributeType } from '@modules/renderer/engine/core/types.js';
import type { Const } from '@modules/renderer/engine/math/types.js';

export class Vec2 {
  declare isVec2: true;

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

  static fromArray(array: NumberArray, offset: number = 0, into: Vec2 = Vec2.new()): Vec2 {
    return into.fromArray(array, offset);
  }

  static fromAttribute(attribute: AttributeType, index: number, into: Vec2 = Vec2.new()): Vec2 {
    return into.fromAttribute(attribute, index);
  }

  static lerp(from: Const<Vec2>, to: Const<Vec2>, step: number, into: Vec2 = Vec2.new()): Vec2 {
    return into.asLerp(from, to, step);
  }

  from(from: Const<Vec2>): this {
    return this.set(from.x, from.y);
  }

  into(into: Vec2): void {
    into.x = this.x;
    into.y = this.y;
  }

  fromAttribute(attribute: AttributeType, index: number): this {
    return this.set(attribute.getX(index), attribute.getY(index));
  }

  intoAttribute(attribute: AttributeType, index: number): this {
    attribute.setXY(index, this.x, this.y);
    return this;
  }

  fromArray(array: Const<NumberArray>, offset: number = 0): this {
    return this.set(array[offset], array[offset + 1]);
  }

  intoArray<T extends NumberArray>(array: T = [] as never, offset: number = 0): T {
    array[offset] = this.x;
    array[offset + 1] = this.y;
    return array;
  }

  asAdd(a: Const<Vec2>, b: Const<Vec2>): this {
    return this.set(a.x + b.x, a.y + b.y);
  }

  asSub(a: Const<Vec2>, b: Const<Vec2>): this {
    return this.set(a.x - b.x, a.y - b.y);
  }

  asLerp(v1: Const<Vec2>, v2: Const<Vec2>, step: number): this {
    return this.set(v1.x + (v2.x - v1.x) * step, v1.y + (v2.y - v1.y) * step);
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

  setX(x: number): this {
    this.x = x;
    return this;
  }

  setY(y: number): this {
    this.y = y;
    return this;
  }

  setScalar(scalar: number): this {
    return this.set(scalar, scalar);
  }

  clone(): Vec2 {
    return Vec2.from(this);
  }

  scale(scalar: number): this {
    return this.set(this.x * scalar, this.y * scalar);
  }

  div({ x, y }: Const<Vec2>): this {
    return this.set(this.x / x, this.y / y);
  }

  divScalar(scalar: number): this {
    return this.set(this.x / scalar, this.y / scalar);
  }

  mul({ x, y }: Const<Vec2>): this {
    return this.set(this.x * x, this.y * y);
  }

  mulScalar(scalar: number): this {
    return this.set(this.x * scalar, this.y * scalar);
  }

  add({ x, y }: Const<Vec2>): this {
    return this.set(this.x + x, this.y + y);
  }

  addScalar(scalar: number): this {
    return this.set(this.x + scalar, this.y + scalar);
  }

  addScaled({ x, y }: Const<Vec2>, scalar: number): this {
    return this.set(this.x + x * scalar, this.y + y * scalar);
  }

  sub({ x, y }: Const<Vec2>): this {
    return this.set(this.x - x, this.y - y);
  }

  subScalar(scalar: number): this {
    return this.set(this.x - scalar, this.y - scalar);
  }

  subScaled({ x, y }: Const<Vec2>, scalar: number): this {
    return this.set(this.x - x * scalar, this.y - y * scalar);
  }

  min({ x, y }: Const<Vec2>): this {
    return this.set(Math.min(this.x, x), Math.min(this.y, y));
  }

  max({ x, y }: Const<Vec2>): this {
    return this.set(Math.max(this.x, x), Math.max(this.y, y));
  }

  equals({ x, y }: Const<Vec2>): boolean {
    return this.x === x && this.y === y;
  }

  clamp(min: Const<Vec2>, max: Const<Vec2>): this {
    return this.set(clamp(this.x, min.x, max.x), clamp(this.y, min.y, max.y));
  }

  clampScalar(min: number, max: number): this {
    return this.set(clamp(this.x, min, max), clamp(this.y, min, max));
  }

  clampLength(min: number, max: number): this {
    return this.normalize().scale(clamp(this.euclidean(), min, max));
  }

  floor(): this {
    return this.set(Math.floor(this.x), Math.floor(this.y));
  }

  ceil(): this {
    return this.set(Math.ceil(this.x), Math.ceil(this.y));
  }

  round(): this {
    return this.set(Math.round(this.x), Math.round(this.y));
  }

  truncate(): this {
    return this.set(Math.trunc(this.x), Math.trunc(this.y));
  }

  negate(): this {
    return this.set(-this.x, -this.y);
  }

  dot({ x, y }: Const<Vec2>): number {
    return this.x * x + this.y * y;
  }

  cross({ x, y }: Const<Vec2>): number {
    return this.x * y - this.y * x;
  }

  euclideanSq(): number {
    return this.x * this.x + this.y * this.y;
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
    return Math.abs(this.x) + Math.abs(this.y);
  }

  normalize(): this {
    return this.divScalar(this.euclidean() || 1);
  }

  angle(): number {
    return Math.atan2(-this.y, -this.x) + Math.PI;
  }

  angleTo(to: Const<Vec2>): number {
    const denominator = Math.sqrt(this.euclideanSq() * to.euclideanSq());
    if (denominator === 0) return Math.PI / 2;
    const theta = this.dot(to) / denominator;
    return Math.acos(clamp(theta, -1, 1));
  }

  euclideanSqTo({ x, y }: Const<Vec2>): number {
    const dx = this.x - x;
    const dy = this.y - y;
    return dx * dx + dy * dy;
  }

  euclideanTo(to: Const<Vec2>): number {
    return Math.sqrt(this.euclideanSqTo(to));
  }

  distanceTo(to: Const<Vec2>): number {
    return this.euclideanTo(to);
  }

  distanceSqTo(to: Const<Vec2>): number {
    return this.euclideanSqTo(to);
  }

  manhattanTo({ x, y }: Const<Vec2>): number {
    return Math.abs(this.x - x) + Math.abs(this.y - y);
  }

  setLength(length: number): this {
    return this.normalize().scale(length);
  }

  applyMat3({ elements: e }: Const<Mat3>): this {
    const { x, y } = this;

    return this.set(e[0] * x + e[3] * y + e[6], e[1] * x + e[4] * y + e[7]);
  }

  applyNMat3(mat: Const<Mat3>): this {
    return this.applyMat3(mat).normalize();
  }

  lerp(vector: Vec2, step: number): this {
    return this.asLerp(this, vector, step);
  }

  rotateAround(center: Const<Vec2>, angle: number): this {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const x = this.x - center.x;
    const y = this.y - center.y;

    return this.set(x * cos - y * sin + center.x, x * sin + y * cos + center.y);
  }

  rotate(angle: number): this {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    return this.set(this.x * cos - this.y * sin, this.x * sin + this.y * cos);
  }

  *[Symbol.iterator](): Iterator<number> {
    yield this.x;
    yield this.y;
  }
}

Vec2.prototype.isVec2 = true;
