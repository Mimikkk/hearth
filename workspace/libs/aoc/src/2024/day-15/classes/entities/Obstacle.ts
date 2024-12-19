import type { Const } from "../../../../types/const.ts";
import type { Vec2 } from "../../../../types/math/Vec2.ts";
import { VecsColider } from "../coliders/VecsColider.ts";

export class Obstacle {
  static new(positions: Vec2[] = [], colider = VecsColider.new()): self {
    return new Self(positions, colider);
  }

  static from(other: Const<self>, into = Self.new()): self {
    return into.from(other);
  }

  static fromVecs(positions: Vec2[]): Obstacle {
    return Obstacle.new(positions, VecsColider.new(positions));
  }

  private constructor(public positions: Vec2[], public colider: VecsColider) {}

  from({ positions }: Const<self>): this {
    return this.fromVecs(positions);
  }

  fromVecs(positions: Const<Vec2[]>): this {
    this.positions = positions.map((p) => p.clone());
    this.colider.set(this.positions);
    return this;
  }

  set(positions: Vec2[], colider: VecsColider): this {
    this.positions = positions;
    this.colider = colider;
    return this;
  }

  clone(): self {
    return Self.from(this);
  }
}

type self = Obstacle;
const Self = Obstacle;
