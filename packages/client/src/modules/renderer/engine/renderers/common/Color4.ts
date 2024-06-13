import { Color } from '@modules/renderer/engine/engine.js';
import { RGB } from '@modules/renderer/engine/math/Color.js';

export type RGBA = RGB & { a: number };

class Color4 extends Color {
  constructor(
    r: number,
    g: number,
    b: number,
    public a: number = 1,
  ) {
    super(r, g, b);
  }

  set(r: number, g: number, b: number, a: number) {
    this.a = a;

    return super.set(r, g, b);
  }

  copy(color: RGB | RGBA) {
    if ('a' in color) this.a = color.a;

    return super.copy(color as any);
  }

  clone() {
    //@ts-expect-error
    return new this.constructor(this.r, this.g, this.b, this.a);
  }
}

export default Color4;
