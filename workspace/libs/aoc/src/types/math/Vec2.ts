import type { Const } from "../const.ts";

export class Vec2 {
  static new(x: number = 0, y: number = 0): self {
    return new Vec2(x, y);
  }

  static from(value: Const<self>, into: self = Self.new()): self {
    return into.from(value);
  }

  static fromArray(array: number[], offset: number = 0, into: self = Self.new()): self {
    return into.fromArray(array, offset);
  }

  static fromParams(x: number, y: number, into: self = Self.new()): self {
    return into.fromParams(x, y);
  }

  private constructor(public x: number, public y: number) {}

  from({ x, y }: Const<self>): this {
    return this.set(x, y);
  }

  fromArray(array: number[], offset: number = 0): this {
    return this.set(array[offset + 0], array[offset + 1]);
  }

  fromParams(x: number, y: number): this {
    return this.set(x, y);
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

  static add(first: Const<self>, second: Const<self>, into: self = Self.new()): self {
    return into.from(first).add(second);
  }

  add({ x, y }: Const<self>): this {
    return this.addXY(x, y);
  }

  addXY(x: number, y: number): this {
    return this.set(this.x + x, this.y + y);
  }

  addX(x: number): this {
    return this.setX(this.x + x);
  }

  addY(y: number): this {
    return this.setY(this.y + y);
  }

  static sub(first: Const<self>, second: Const<self>, into: self = Self.new()): self {
    return into.from(first).sub(second);
  }

  sub({ x, y }: Const<self>): this {
    return this.subXY(x, y);
  }

  subXY(x: number, y: number): this {
    return this.set(this.x - x, this.y - y);
  }

  subX(x: number): this {
    return this.setX(this.x - x);
  }

  subY(y: number): this {
    return this.setY(this.y - y);
  }

  static mod(first: Const<self>, second: Const<self>, into: self = Self.new()): self {
    return into.from(first).mod(second);
  }

  mod({ x, y }: Const<self>): this {
    return this.set(this.x % x, this.y % y);
  }

  modX(x: number): this {
    return this.setX(this.x % x);
  }

  modY(y: number): this {
    return this.setY(this.y % y);
  }

  modXY(x: number, y: number): this {
    return this.set(this.x % x, this.y % y);
  }

  static max(first: Const<self>, second: Const<self>, into: self = Self.new()): self {
    return into.from(first).max(second);
  }

  max({ x, y }: Const<self>): this {
    return this.set(Math.max(this.x, x), Math.max(this.y, y));
  }

  maxX(x: number): this {
    return this.setX(Math.max(this.x, x));
  }

  maxY(y: number): this {
    return this.setY(Math.max(this.y, y));
  }

  maxXY(x: number, y: number): this {
    return this.set(Math.max(this.x, x), Math.max(this.y, y));
  }

  static min(first: Const<self>, second: Const<self>, into: self = Self.new()): self {
    return into.from(first).min(second);
  }

  min({ x, y }: Const<self>): this {
    return this.set(Math.min(this.x, x), Math.min(this.y, y));
  }

  minX(x: number): this {
    return this.setX(Math.min(this.x, x));
  }

  minY(y: number): this {
    return this.setY(Math.min(this.y, y));
  }

  minXY(x: number, y: number): this {
    return this.set(Math.min(this.x, x), Math.min(this.y, y));
  }

  static manhattan(first: Const<self>, second: Const<self>): number {
    return first.manhattan(second);
  }

  manhattan({ x, y }: Const<self>): number {
    return Math.abs(this.x - x) + Math.abs(this.y - y);
  }

  static determinant(first: Const<self>, second: Const<self>): number {
    return first.determinant(second);
  }

  determinant({ x, y }: Const<self>): number {
    return this.x * y - this.y * x;
  }

  static equals(first: Const<self>, second: Const<self>): boolean {
    return first.equals(second);
  }

  equals({ x, y }: Const<self>): boolean {
    return this.x === x && this.y === y;
  }

  clone(into: self = Self.new()): self {
    return into.from(this);
  }

  toArray(offset: number = 0, into: number[] = []) {
    into[offset + 0] = this.x;
    into[offset + 1] = this.y;
    return into;
  }
}

type self = Vec2;
const Self = Vec2;
