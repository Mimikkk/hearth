import type { Const } from "../../../../../types/const.ts";
import { Ids } from "../../../../../types/math/Ids.ts";
import type { Vec2 } from "../../../../../types/math/Vec2.ts";
import type { Cloneable } from "../Cloneable.ts";
import type { IColider } from "./ICollider.ts";

export class SetColider implements IColider, Cloneable<self> {
  static new(cloud: Set<number> = new Set()): self {
    return new Self(cloud);
  }

  static from(colider: Const<self>, into = Self.new()): self {
    return into.from(colider);
  }

  static fromVecs(vecs: Const<Vec2[]>, into = Self.new()): self {
    return into.fromVecs(vecs);
  }

  private constructor(public cloud: Set<number>) {}

  from({ cloud }: Const<self>): this {
    return this.set(new Set(cloud));
  }

  fromVecs(vecs: Const<Vec2[]>): this {
    return this.set(new Set(vecs.map(Ids.v2i32)));
  }

  set(cloud: Set<number>): this {
    this.cloud = cloud;
    return this;
  }

  contains(id: number): boolean {
    return this.cloud.has(id);
  }

  containsXY(x: number, y: number): boolean {
    return this.contains(Ids.xyi32(x, y));
  }

  containsVec(vec: Const<Vec2>): boolean {
    return this.contains(Ids.v2i32(vec));
  }

  clone(): self {
    return Self.from(this);
  }
}

type self = SetColider;
const Self = SetColider;
