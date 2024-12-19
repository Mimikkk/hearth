import type { Const } from "../../../../types/const.ts";
import { Vec2 } from "../../../../types/math/Vec2.ts";
import { VecsColider } from "../coliders/VecsColider.ts";

export class Player {
  static new(position = Vec2.new(), colider = VecsColider.new()): self {
    return new Player(position, colider);
  }

  static from(other: Const<self>, into = Self.new()): self {
    return into.from(other);
  }

  static fromVec(vec: Const<Vec2>, into = Self.new()): self {
    return into.fromVec(vec);
  }

  private constructor(public position: Vec2, public colider: VecsColider) {}

  from({ position }: Const<self>): this {
    return this.fromVec(position);
  }

  fromVec(vec: Const<Vec2>): this {
    this.position.from(vec);
    this.colider.set([this.position]);
    return this;
  }

  set(position: Vec2, colider: VecsColider): this {
    this.position = position;
    this.colider = colider;
    return this;
  }

  clone(): self {
    return Self.from(this);
  }
}

type self = Player;
const Self = Player;
