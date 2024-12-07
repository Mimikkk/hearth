import type { Const } from "../const.ts";

export class Vec2 {
  static new(x: number = 0, y: number = 0): self {
    return new Vec2(x, y);
  }

  static from(value: Const<self>, into: self = Self.new()): self {
    return into.from(value);
  }

  private constructor(public x: number, public y: number) {}

  from({ x, y }: Const<self>): this {
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

  static equals(first: Const<self>, second: Const<self>): boolean {
    return first.equals(second);
  }

  equals({ x, y }: Const<self>): boolean {
    return this.x === x && this.y === y;
  }

  clone(into: self = Self.new()): self {
    return into.from(this);
  }
}

type self = Vec2;
const Self = Vec2;
