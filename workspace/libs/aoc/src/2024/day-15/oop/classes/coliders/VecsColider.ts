import type { Const } from "../../../../../types/const.ts";
import { Ids } from "../../../../../types/math/Ids.ts";
import type { Vec2 } from "../../../../../types/math/Vec2.ts";
import type { Cloneable } from "../Cloneable.ts";
import type { IColider } from "./ICollider.ts";

export class VecsColider implements IColider, Cloneable<self> {
  static new(vecs: Vec2[] = []): self {
    return new Self(vecs);
  }

  static from(colider: Const<self>, into = Self.new()): self {
    return into.from(colider);
  }

  static fromVecs(vecs: Const<Vec2[]>, into = Self.new()): self {
    return into.fromVecs(vecs);
  }

  private constructor(public vecs: Vec2[]) {}

  from({ vecs }: Const<self>): this {
    return this.set(vecs.map((v) => v.clone()));
  }

  fromVecs(vecs: Const<Vec2[]>): this {
    return this.set(vecs.map((v) => v.clone()));
  }

  set(vecs: Vec2[]): this {
    this.vecs = vecs;
    return this;
  }

  contains(id: number): boolean {
    return this.containsXY(Ids.i32x(id), Ids.i32y(id));
  }

  containsXY(x: number, y: number): boolean {
    return this.vecs.some(({ x: px, y: py }) => x === px && y === py);
  }

  containsVec({ x, y }: Const<Vec2>): boolean {
    return this.containsXY(x, y);
  }

  clone(): self {
    return Self.from(this);
  }
}

type self = VecsColider;
const Self = VecsColider;
