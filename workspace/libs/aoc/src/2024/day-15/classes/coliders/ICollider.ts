import type { Const } from "../../../../types/const.ts";
import type { Vec2 } from "../../../../types/math/Vec2.ts";

export interface IColider {
  contains(id: number): boolean;
  containsXY(x: number, y: number): boolean;
  containsVec(position: Const<Vec2>): boolean;
}
