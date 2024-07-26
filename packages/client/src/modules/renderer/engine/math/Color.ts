import { clamp, euclideanMod, NumberArray } from './MathUtils.js';
import { ColorManagement, LinearToSRGB, SRGBToLinear } from './ColorManagement.js';
import { from } from '../constants.js';
import type { Mat3 } from '@modules/renderer/engine/math/Mat3.js';
import { Const } from '@modules/renderer/engine/math/types.js';
import { AttributeType } from '@modules/renderer/engine/core/types.js';

export { ColorMap } from './Color.map.js';

function hue2rgb(p: number, q: number, t: number): number {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;

  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * 6 * (2 / 3 - t);
  return p;
}

export type ColorRepresentation = Color | number;

export class Color {
  declare isColor: true;

  r: number = 0;
  g: number = 0;
  b: number = 0;
  a: number = 1;

  constructor();
  constructor(r: ColorRepresentation);
  constructor(r: number, g: number, b: number);
  constructor(r: number, g: number, b: number, a: number);
  constructor(r?: number | ColorRepresentation, g?: number, b?: number, a: number = 1) {
    if (r) this.set(r as number, g!, b!, a);
  }

  static is(value: any): value is Color {
    return value?.isColor === true;
  }

  static new(): Color;
  static new(r: ColorRepresentation): Color;
  static new(r: number, g: number, b: number): Color;
  static new(r: number, g: number, b: number, a: number): Color;
  static new(r?: number | ColorRepresentation, g?: number, b?: number, a: number = 1): Color {
    return new Color(r as number, g!, b!, a);
  }

  static from(color: Const<Color>, into: Color = Color.new()): Color {
    return into.from(color);
  }

  static fromArray(array: Const<NumberArray>, offset: number = 0, into: Color = Color.new()): Color {
    return into.fromArray(array, offset);
  }

  static fromAttribute(attribute: AttributeType, index: number, into: Color = Color.new()): Color {
    return into.fromAttribute(attribute, index);
  }

  static into(into: Color, color: Const<Color>): Color {
    return into.from(color);
  }

  clone(): Color {
    return new Color(this.r, this.g, this.b, this.a);
  }

  from({ r, g, b, a }: Const<Color>): this {
    return this.set(r, g, b, a);
  }

  set(r: ColorRepresentation): this;
  set(r: number, g: number, b: number): this;
  set(r: number, g: number, b: number, a: number): this;
  set(r: ColorRepresentation, g?: number, b?: number, a?: number): this {
    if (g === undefined) {
      if (Color.is(r)) return this.from(r);
      return this.setHex(r);
    } else {
      this.setRGB(r as number, g, b!);
      if (a !== undefined) this.a = a;
    }

    return this;
  }

  setScalar(scalar: number): this {
    this.r = scalar;
    this.g = scalar;
    this.b = scalar;
    this.a = 1;

    return this;
  }

  setHex(hex: number): this {
    hex = ~~hex;

    this.r = ((hex >> 16) & 255) / 255;
    this.g = ((hex >> 8) & 255) / 255;
    this.b = (hex & 255) / 255;

    ColorManagement.intoSpace(this, from.SRGB);

    return this;
  }

  setRGB(r: number, g: number, b: number, space: from = ColorManagement.space): this {
    this.r = r;
    this.g = g;
    this.b = b;

    ColorManagement.intoSpace(this, space);

    return this;
  }

  setHSL(h: number, s: number, l: number, space: from = ColorManagement.space): this {
    h = euclideanMod(h, 1);
    s = clamp(s, 0, 1);
    l = clamp(l, 0, 1);

    if (s === 0) {
      this.r = l;
      this.g = l;
      this.b = l;
    } else {
      const p = l <= 0.5 ? l * (1 + s) : l + s - l * s;
      const q = 2 * l - p;

      this.r = hue2rgb(q, p, h + 1 / 3);
      this.g = hue2rgb(q, p, h);
      this.b = hue2rgb(q, p, h - 1 / 3);
    }

    ColorManagement.intoSpace(this, space);

    return this;
  }

  fromSRGBToLinear(color: Const<Color>): this {
    return this.set(SRGBToLinear(color.r), SRGBToLinear(color.g), SRGBToLinear(color.b));
  }

  fromLinearToSRGB(color: Const<Color>): this {
    return this.set(LinearToSRGB(color.r), LinearToSRGB(color.g), LinearToSRGB(color.b));
  }

  getRGB(into: Color, space: from = ColorManagement.space): Color {
    const _color = ColorManagement.fromSpace(Color.new().from(this), space);
    into.r = _color.r;
    into.g = _color.g;
    into.b = _color.b;
    return into;
  }

  add(color: Const<Color>): this {
    this.r += color.r;
    this.g += color.g;
    this.b += color.b;

    return this;
  }

  addScalar(s: number): this {
    this.r += s;
    this.g += s;
    this.b += s;

    return this;
  }

  sub(color: Const<Color>): this {
    this.r = Math.max(0, this.r - color.r);
    this.g = Math.max(0, this.g - color.g);
    this.b = Math.max(0, this.b - color.b);

    return this;
  }

  mul(color: Const<Color>): this {
    this.r *= color.r;
    this.g *= color.g;
    this.b *= color.b;

    return this;
  }

  scale(s: number): this {
    return this.set(this.r * s, this.g * s, this.b * s);
  }

  lerp(color: Const<Color>, step: number, withA?: boolean): this {
    return this.asLerp(this, color, step, withA);
  }

  asLerp(from: Const<Color>, to: Const<Color>, step: number, withA?: boolean): this {
    return this.set(
      from.r + (to.r - from.r) * step,
      from.g + (to.g - from.g) * step,
      from.b + (to.b - from.b) * step,
      withA ? from.a + (to.a - from.a) * step : from.a,
    );
  }

  asSRGBToLinear(): this {
    return this.fromSRGBToLinear(this);
  }

  asLinearToSRGB(): this {
    return this.fromLinearToSRGB(this);
  }

  applyMat3(mat: Const<Mat3>): this {
    const r = this.r,
      g = this.g,
      b = this.b;
    const e = mat.elements;

    this.r = e[0] * r + e[3] * g + e[6] * b;
    this.g = e[1] * r + e[4] * g + e[7] * b;
    this.b = e[2] * r + e[5] * g + e[8] * b;

    return this;
  }

  fromArray(array: Const<NumberArray>, offset: number = 0): this {
    this.r = array[offset];
    this.g = array[offset + 1];
    this.b = array[offset + 2];

    // thinkthrough
    return this.set(array[offset], array[offset + 1], array[offset + 2]);
  }

  intoArray<T extends NumberArray>(array: T = [] as never, offset: number = 0): T {
    array[offset] = this.r;
    array[offset + 1] = this.g;
    array[offset + 2] = this.b;
    array[offset + 3] = this.a;
    return array;
  }

  fromAttribute(attribute: AttributeType, index: number): this {
    return this.set(attribute.getX(index), attribute.getY(index), attribute.getZ(index), attribute.getW(index));
  }

  intoAttribute(attribute: AttributeType, index: number): this {
    attribute.setXYZW(index, this.r, this.g, this.b, this.a);
    return this;
  }

  intoStyle(): string {
    const { r, g, b, a } = this;

    return `rgba(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)},${Math.round(a * 255)})`;
  }

  equals(color: Const<Color>): boolean {
    return color.r === this.r && color.g === this.g && color.b === this.b;
  }

  *[Symbol.iterator](): Iterator<number> {
    yield this.r;
    yield this.g;
    yield this.b;
  }
}

Color.prototype.isColor = true;
