import type { Const } from "../../../../types/const.ts";
import type { Vec2 } from "../../../../types/math/Vec2.ts";
import { SetColider } from "../coliders/SetColider.ts";

export class Walls {
  static new(positions: Vec2[] = [], colider = SetColider.new()): self {
    return new Walls(positions, colider);
  }

  static from(other: Const<self>, into = Self.new()): self {
    return into.from(other);
  }

  static fromVecs(vecs: Const<Vec2[]>, into = Self.new()): self {
    return into.fromVecs(vecs);
  }

  private constructor(public positions: Vec2[], public colider: SetColider) {}

  from({ positions }: Const<self>): this {
    return this.fromVecs(positions);
  }

  fromVecs(vecs: Const<Vec2[]>): this {
    this.positions = vecs.map((v) => v.clone());
    this.colider.fromVecs(this.positions);
    return this;
  }

  set(positions: Vec2[], colider: SetColider): this {
    this.positions = positions;
    this.colider = colider;
    return this;
  }

  clone(): self {
    return Self.from(this);
  }
}

type self = Walls;
const Self = Walls;
