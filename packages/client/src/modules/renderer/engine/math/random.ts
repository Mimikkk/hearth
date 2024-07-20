import { Color, ColorMap } from '@modules/renderer/engine/math/Color.js';
import { IVec3 } from '@modules/renderer/engine/math/Vector3.js';
import { Vec4 } from '@modules/renderer/engine/math/Vector4.js';
import { Vec2 } from '@modules/renderer/engine/math/Vector2.js';

export namespace Random {
  export const number = (min: number = 0, max: number = 1): number => Math.random() * (max - min) + min;
  export const boolean = (): boolean => Math.random() > 0.5;

  export const radian = (min: number = 0, max: number = Math.PI * 2): number => number(min, max);
  export const angle = (min: number = 0, max: number = 360): number => number(min, max);
  export const color = (min: number = 0, max: number = ColorMap.white): Color => new Color(number(min, max));

  export const vec4 = (min: number = 0, max: number = 1): Vec4 =>
    Vec4.create(number(min, max), number(min, max), number(min, max), number(min, max));
  export const vec3 = (min: number = 0, max: number = 1): IVec3 =>
    IVec3.create(number(min, max), number(min, max), number(min, max));
  export const vec2 = (min: number = 0, max: number = 1): Vec2 => Vec2.new(number(min, max), number(min, max));
}
