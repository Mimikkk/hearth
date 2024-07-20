import { Color, ColorMap } from '@modules/renderer/engine/math/Color.js';

export namespace Random {
  export const between = (min: number = 0, max: number = 1) => Math.random() * (max - min) + min;

  export const radian = (min: number = 0, max: number = Math.PI * 2) => between(min, max);
  export const angle = (min: number = 0, max: number = 360) => between(min, max);
  export const color = (min: number = 0, max: number = ColorMap.white) => new Color(between(min, max));
}
