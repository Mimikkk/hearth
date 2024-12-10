import type { Const } from "../const.ts";
import { Vec2 } from "./Vec2.ts";

export namespace Ids {
  export const v2i32 = ({ x, y }: Const<Vec2>): number => xyi32(x, y);
  export const xyi32 = (x: number, y: number): number => ((x & 0xFFFF) << 16) | (y & 0xFFFF);
  export const i32v2 = (id: number): Vec2 => Vec2.new((id >> 16) & 0xFFFF, id & 0xFFFF);
}
