import type { Const } from "../const.ts";

export class Vec2 {
  static new(x: number = 0, y: number = 0): Vec2 {
    return new Vec2(x, y);
  }

  private constructor(public x = 0, public y = 0) {}

  static from(value: Const<Vec2>, into: Vec2 = Vec2.new()) {
    return into.from(value);
  }

  from({ x, y }: Const<Vec2>): this {
    return this.set(x, y);
  }

  set(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this;
  }

  add(other: Const<Vec2>): this {
    return this.set(this.x + other.x, this.y + other.y);
  }

  addXY(dx: number, dy: number): this {
    return this.set(this.x + dx, this.y + dy);
  }

  addX(offset: number): this {
    return this.set(this.x + offset, this.y);
  }

  addY(offset: number): this {
    return this.set(this.x, this.y + offset);
  }

  sub(other: Const<Vec2>): this {
    return this.set(this.x - other.x, this.y - other.y);
  }

  subXY(dx: number, dy: number): this {
    return this.set(this.x - dx, this.y - dy);
  }

  subX(offset: number): this {
    return this.set(this.x - offset, this.y);
  }

  subY(offset: number): this {
    return this.set(this.x, this.y - offset);
  }
}
