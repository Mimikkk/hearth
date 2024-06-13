import { ArcCurve } from './ArcCurve.js';
import { CubicBezierCurve } from './CubicBezierCurve.js';
import { EllipseCurve } from './EllipseCurve.js';
import { QuadraticBezierCurve } from './QuadraticBezierCurve.js';
import { LineCurve } from './LineCurve.js';
import { SplineCurve } from './SplineCurve.js';
import { CatmullRomCurve3 } from './CatmullRomCurve3.js';
import { CubicBezierCurve3 } from './CubicBezierCurve3.js';
import { LineCurve3 } from './LineCurve3.js';
import { QuadraticBezierCurve3 } from './QuadraticBezierCurve3.js';

export const Curves = {
  D2: {
    ArcCurve,
    CubicBezierCurve,
    EllipseCurve,

    LineCurve,
    QuadraticBezierCurve,
    SplineCurve,
  },
  D3: {
    CatmullRomCurve3,
    CubicBezierCurve3,
    LineCurve3,
    QuadraticBezierCurve3,
  },
};

export {
  ArcCurve,
  CatmullRomCurve3,
  CubicBezierCurve,
  CubicBezierCurve3,
  EllipseCurve,
  LineCurve,
  LineCurve3,
  QuadraticBezierCurve,
  QuadraticBezierCurve3,
  SplineCurve,
};
