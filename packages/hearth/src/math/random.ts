import { Color, ColorMap } from './Color.js';
import { Vec3 } from './Vec3.js';
import { Vec4 } from './Vec4.js';
import { Vec2 } from './Vec2.js';

export namespace Random {
  export const number = (min: number = 0, max: number = 1): number => Math.random() * (max - min) + min;
  export const integer = (min: number = 0, max: number = 1): number => Math.floor(number(min, max) + 0.5);
  export const boolean = (): boolean => Math.random() > 0.5;

  export const radian = (min: number = 0, max: number = Math.PI * 2): number => number(min, max);
  export const angle = (min: number = 0, max: number = 360): number => number(min, max);

  export const color = (min: number = ColorMap.white, max: number = ColorMap.black, into: Color = Color.new()): Color =>
    into.set(number(min, max));
  export const vec4 = (min: number = 0, max: number = 1, into: Vec4 = Vec4.new()): Vec4 =>
    into.set(number(min, max), number(min, max), number(min, max), number(min, max));
  export const vec3 = (min: number = 0, max: number = 1, into: Vec3 = Vec3.new()): Vec3 =>
    into.set(number(min, max), number(min, max), number(min, max));
  export const vec2 = (min: number = 0, max: number = 1, into: Vec2 = Vec2.new()): Vec2 =>
    into.set(number(min, max), number(min, max));
}
