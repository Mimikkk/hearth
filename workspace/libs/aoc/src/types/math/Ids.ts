import type { Const } from "../const.ts";
import { Vec2 } from "./Vec2.ts";

export namespace Ids {
  export const v2i32 = ({ x, y }: Const<Vec2>): number => xyi32(x, y);

  export const xi32 = (x: number): number => ((x & 0xFFFF) << 16);
  export const yi32 = (y: number): number => (y & 0xFFFF);
  export const xyi32 = (x: number, y: number): number => xi32(x) | yi32(y);

  export const i32x = (id: number): number => (id >> 16) & 0xFFFF;
  export const i32y = (id: number): number => id & 0xFFFF;
  export const i32v2 = (id: number): Vec2 => Vec2.new(i32x(id), i32y(id));
}
