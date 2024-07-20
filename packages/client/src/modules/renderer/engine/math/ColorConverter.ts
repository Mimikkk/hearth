import { clamp, euclideanModulo } from './MathUtils.js';
import type { Color, HSV } from './Color.js';

export class ColorConverter {
  static setHSV(color: Color, h: number, s: number, v: number): Color {
    h = euclideanModulo(h, 1);
    s = clamp(s, 0, 1);
    v = clamp(v, 0, 1);

    return color.setHSL(h, (s * v) / ((h = (2 - s) * v) < 1 ? h : 2 - h), h * 0.5);
  }

  static getHSV(color: Color, target: HSV): HSV {
    const _hsl = color.getHSL({ h: 0, s: 0, l: 0 });

    _hsl.s *= _hsl.l < 0.5 ? _hsl.l : 1 - _hsl.l;

    target.h = _hsl.h;
    target.s = (2 * _hsl.s) / (_hsl.l + _hsl.s);
    target.v = _hsl.l + _hsl.s;

    return target;
  }
}
