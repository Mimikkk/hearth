import { InterpolationEndingMode } from '../../constants.js';
import { Interpolant } from '../Interpolant.js';
import type { TypedArray } from '../MathUtils.js';

export class CubicInterpolant<T extends TypedArray> extends Interpolant<T> {
  endingStart: InterpolationEndingMode = InterpolationEndingMode.ZeroCurvature;
  endingEnd: InterpolationEndingMode = InterpolationEndingMode.ZeroCurvature;

  _weightPrev: number = -0;
  _offsetPrev: number = -0;
  _weightNext: number = -0;
  _offsetNext: number = -0;

  constructor(parameterPositions: number[], sampleValues: T, valueSize: number, resultBuffer?: T) {
    super(parameterPositions, sampleValues, valueSize, resultBuffer);
  }

  override intervalChanged_(i1: number, t0: number, t1: number): void {
    const pp = this.parameterPositions;
    let iPrev = i1 - 2;
    let iNext = i1 + 1;
    let tPrev = pp[iPrev];
    let tNext = pp[iNext];

    if (tPrev === undefined) {
      switch (this.endingStart) {
        case InterpolationEndingMode.ZeroSlope:
          iPrev = i1;
          tPrev = 2 * t0 - t1;
          break;
        case InterpolationEndingMode.WrapAround:
          iPrev = pp.length - 2;
          tPrev = t0 + pp[iPrev] - pp[iPrev + 1];
          break;
        case InterpolationEndingMode.ZeroCurvature:
          iPrev = i1;
          tPrev = t1;
          break;
        default:
          throw new Error('Unsupported interpolation ending mode.');
      }
    }

    if (tNext === undefined) {
      switch (this.endingEnd) {
        case InterpolationEndingMode.ZeroSlope:
          iNext = i1;
          tNext = 2 * t1 - t0;
          break;
        case InterpolationEndingMode.WrapAround:
          iNext = 1;
          tNext = t1 + pp[1] - pp[0];
          break;
        case InterpolationEndingMode.ZeroCurvature:
          iNext = i1 - 1;
          tNext = t0;
          break;
        default:
          throw new Error('Unsupported interpolation ending mode.');
      }
    }

    const halfDt = (t1 - t0) * 0.5;
    const stride = this.valueSize;

    this._weightPrev = halfDt / (t0 - tPrev);
    this._weightNext = halfDt / (tNext - t1);
    this._offsetPrev = iPrev * stride;
    this._offsetNext = iNext * stride;
  }

  override interpolate_(i1: number, t0: number, t: number, t1: number): T {
    const result = this.resultBuffer;
    const values = this.sampleValues;
    const stride = this.valueSize;
    const o1 = i1 * stride;
    const o0 = o1 - stride;
    const oP = this._offsetPrev;
    const oN = this._offsetNext;
    const wP = this._weightPrev;
    const wN = this._weightNext;
    const p = (t - t0) / (t1 - t0);
    const pp = p * p;
    const ppp = pp * p;

    const sP = -wP * ppp + 2 * wP * pp - wP * p;
    const s0 = (1 + wP) * ppp + (-1.5 - 2 * wP) * pp + (-0.5 + wP) * p + 1;
    const s1 = (-1 - wN) * ppp + (1.5 + wN) * pp + 0.5 * p;
    const sN = wN * ppp - wN * pp;

    for (let i = 0; i !== stride; ++i) {
      result[i] = sP * values[oP + i] + s0 * values[o0 + i] + s1 * values[o1 + i] + sN * values[oN + i];
    }

    return result;
  }
}
