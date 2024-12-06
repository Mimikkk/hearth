import type { Const } from "../const.ts";
import { Vec2 } from "./Vec2.ts";

export namespace Ids {
  export const fromVec2 = ({ x, y }: Const<Vec2>): number => ((x & 0xFFFF) << 16) | (y & 0xFFFF);

  export const toVec2 = (id: number): Vec2 => Vec2.new((id >> 16) & 0xFFFF, id & 0xFFFF);
}
