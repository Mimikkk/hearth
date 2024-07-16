import { IVec2, Vec2 } from '@modules/renderer/engine/math/Vector2.js';
import { Const } from './types.ts';

export class Box2 {
  declare isBox2: true;

  constructor(
    public min: Vec2 = Vec2.new(Infinity, Infinity),
    public max: Vec2 = Vec2.new(-Infinity, -Infinity),
  ) {}

  static new(min: Vec2 = Vec2.new(Infinity, Infinity), max: Vec2 = Vec2.new(-Infinity, -Infinity)): Box2 {
    return new Box2(min, max);
  }

  static corners(minX: number, minY: number, maxX: number, maxY: number): Box2 {
    return Box2.new().setCorners(minX, minY, maxX, maxY);
  }

  static empty(): Box2 {
    return Box2.new();
  }

  static clone({ min, max }: Const<Box2>, into: Box2 = Box2.empty()): Box2 {
    return into.set(min, max);
  }

  static is(box: any): box is Box2 {
    return box?.isBox2 === true;
  }

  static into(into: Box2, { min, max }: Const<Box2>): Box2 {
    return into.set(min, max);
  }

  static from({ min, max }: Const<Box2>, into: Box2 = Box2.empty()): Box2 {
    return into.set(min, max);
  }

  static fromArray(array: number[], offset: number = 0, into: Box2 = Box2.empty()): Box2 {
    return into.fromArray(array, offset);
  }

  static fromCoords(coords: Const<Vec2>[], into: Box2 = Box2.empty()): Box2 {
    return into.expandCoords(coords);
  }

  static fromCenterSize(center: Const<Vec2>, size: Const<Vec2>, into: Box2 = Box2.empty()): Box2 {
    return into.fromCenterSize(center, size);
  }

  fill(into: Box2): this {
    into.from(this);
    return this;
  }

  from({ max, min }: Const<Box2>): this {
    return this.set(min, max);
  }

  fromArray(array: number[], offset: number = 0): this {
    return this.setCorners(array[offset], array[offset + 1], array[offset + 2], array[offset + 3]);
  }

  intoArray(array: number[] = [], offset: number = 0): number[] {
    array[offset] = this.min.x;
    array[offset + 1] = this.min.y;
    array[offset + 2] = this.max.x;
    array[offset + 3] = this.max.y;
    return array;
  }

  fromCoords(coords: Const<Vec2>[]): this {
    return this.clear().expandCoords(coords);
  }

  fromCenterSize(center: Const<Vec2>, size: Const<Vec2>): this {
    const halfSizeX = size.x / 2;
    const halfSizeY = size.y / 2;

    return this.setCorners(center.x - halfSizeX, center.y - halfSizeY, center.x + halfSizeX, center.y + halfSizeY);
  }

  set(min: Vec2, max: Vec2): this {
    this.min.from(min);
    this.max.from(max);
    return this;
  }

  setMin(min: Vec2): this {
    this.min.from(min);
    return this;
  }

  setMax(max: Vec2): this {
    this.max.from(max);
    return this;
  }

  setCorners(minX: number, minY: number, maxX: number, maxY: number): this {
    this.min.set(minX, minY);
    this.max.set(maxX, maxY);
    return this;
  }

  equals({ min, max }: Const<Box2>): boolean {
    return this.min.equals(min) && this.max.equals(max);
  }

  isEmpty(): boolean {
    return this.max.x < this.min.x || this.max.y < this.min.y;
  }

  intersects({ max, min }: Const<Box2>): boolean {
    return max.x >= this.min.x && min.x <= this.max.x && max.y >= this.min.y && min.y <= this.max.y;
  }

  contains({ min, max }: Const<Box2>): boolean {
    return this.min.x <= min.x && max.x <= this.max.x && this.min.y <= min.y && max.y <= this.max.y;
  }

  containsVec({ x, y }: Const<IVec2>): boolean {
    return !(x < this.min.x || x > this.max.x || y < this.min.y || y > this.max.y);
  }

  clear(): this {
    this.min.set(Infinity, Infinity);
    this.max.set(-Infinity, -Infinity);
    return this;
  }

  size(into: Vec2 = Vec2.new()): Vec2 {
    if (this.isEmpty()) return into.set(0, 0);
    return into.set(this.max.x - this.min.x, this.max.y - this.min.y);
  }

  center(into: Vec2 = Vec2.new()): Vec2 {
    if (this.isEmpty()) return into.set(0, 0);
    return into.set((this.min.x + this.max.x) / 2, (this.min.y + this.max.y) / 2);
  }

  intersect({ max, min }: Const<Box2>): this {
    this.min.max(min);
    this.max.min(max);

    if (this.isEmpty()) this.clear();

    return this;
  }

  union({ max, min }: Const<Box2>): this {
    this.min.min(min);
    this.max.max(max);

    return this;
  }

  translate(vec: Const<IVec2>): this {
    this.min.add(vec);
    this.max.add(vec);

    return this;
  }

  clamp(vec: Vec2): Vec2 {
    return vec.clamp(this.min, this.max);
  }

  euclideanSqTo(vec: Const<IVec2>): number {
    return this.clamp(as(vec)).distanceSqTo(vec);
  }

  euclideanTo(vec: Const<IVec2>): number {
    return Math.sqrt(this.euclideanSqTo(vec));
  }

  distanceSqTo(vec: Const<IVec2>): number {
    return this.euclideanSqTo(vec);
  }

  distanceTo(vec: Const<IVec2>): number {
    return Math.sqrt(this.distanceSqTo(vec));
  }

  expandCoord(coord: Const<IVec2>): this {
    this.min.min(coord);
    this.max.max(coord);

    return this;
  }

  expandCoords(coords: Const<IVec2>[]): this {
    for (let i = 0, it = coords.length; i < it; ++i) this.expandCoord(coords[i]);

    return this;
  }

  expandVec(vec: Const<IVec2>): this {
    this.min.sub(vec);
    this.max.add(vec);

    return this;
  }

  expandScalar(scalar: number): this {
    this.min.subScalar(scalar);
    this.max.addScalar(scalar);

    return this;
  }
}

const _vec = Vec2.new();
const as = (item: any) => _vec.from(item);
