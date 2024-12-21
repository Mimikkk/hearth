import type { Const } from "../const.ts";
import { Vec2 } from "./Vec2.ts";

export namespace Ids {
  export const ni8 = (x: number, offset: number): number => (x & 0xFF) << offset;
  export const ni16 = (x: number, offset: number): number => (x & 0xFFFF) << offset;

  export const i8n = (x: number, offset: number): number => (x >> offset) & 0xFF;
  export const i16n = (x: number, offset: number): number => (x >> offset) & 0xFFFF;

  export const n2i32 = (x: number, y: number): number => ni16(x, 16) | ni16(y, 0);
  export const n3i32 = (x: number, y: number, z: number): number => ni16(x, 22) | ni16(y, 11) | ni16(z, 0);
  export const n4i32 = (x: number, y: number, z: number, w: number): number =>
    ni8(x, 24) | ni8(y, 16) | ni8(z, 8) | ni8(w, 0);

  export const i32x = (id: number): number => i16n(id, 16);
  export const i32y = (id: number): number => i16n(id, 0);
  export const i32v2 = (id: number, into = Vec2.new()): Vec2 => into.set(i32x(id), i32y(id));
  export const v2i32 = ({ x, y }: Const<Vec2>): number => xyi32(x, y);

  export const xi32 = (x: number): number => ni16(x, 16);
  export const yi32 = (y: number): number => ni16(y, 0);
  export const xyi32 = (x: number, y: number): number => ni16(x, 16) | ni16(y, 0);
}
