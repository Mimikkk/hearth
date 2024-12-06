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

  addXY(dx: number, dy: number): this {
    return this.set(this.x + dx, this.y + dy);
  }

  addX(offset: number): this {
    return this.setX(this.x + offset);
  }

  addY(offset: number): this {
    return this.setY(this.y + offset);
  }

  static sub(first: Const<self>, second: Const<self>, into: self = Self.new()): self {
    return into.from(first).sub(second);
  }

  sub({ x, y }: Const<self>): this {
    return this.subXY(x, y);
  }

  subXY(dx: number, dy: number): this {
    return this.set(this.x - dx, this.y - dy);
  }

  subX(offset: number): this {
    return this.setX(this.x - offset);
  }

  subY(offset: number): this {
    return this.setY(this.y - offset);
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
