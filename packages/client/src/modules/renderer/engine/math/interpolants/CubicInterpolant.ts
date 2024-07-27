import { InterpolationEndingMode } from '../../constants.js';
import { Interpolant } from './Interpolant.js';
import type { TypedArray } from '../MathUtils.js';

export class CubicInterpolant<T extends TypedArray = any, V extends TypedArray = any> extends Interpolant<T, V> {
  endingStart: InterpolationEndingMode = InterpolationEndingMode.ZeroCurvature;
  endingEnd: InterpolationEndingMode = InterpolationEndingMode.ZeroCurvature;

  _weightPrev: number = -0;
  _offsetPrev: number = -0;
  _weightNext: number = -0;
  _offsetNext: number = -0;

  override interpolate(index: number, previousAt: number, at: number, currentAt: number): V {
    const result = this.resultBuffer;
    const values = this.sampleValues;
    const stride = this.valueSize;
    const o1 = index * stride;
    const o0 = o1 - stride;

    const oP = this._offsetPrev;
    const oN = this._offsetNext;
    const wP = this._weightPrev;
    const wN = this._weightNext;
    const p = (at - previousAt) / (currentAt - previousAt);
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

  onIntervalChange(index: number, previousAt: number, currentAt: number): void {
    const pp = this.parameterPositions;
    let iPrev = index - 2;
    let iNext = index + 1;
    let tPrev = pp[iPrev];
    let tNext = pp[iNext];

    if (tPrev === undefined) {
      switch (this.endingStart) {
        case InterpolationEndingMode.ZeroSlope:
          iPrev = index;
          tPrev = 2 * previousAt - currentAt;
          break;
        case InterpolationEndingMode.WrapAround:
          iPrev = pp.length - 2;
          tPrev = previousAt + pp[iPrev] - pp[iPrev + 1];
          break;
        case InterpolationEndingMode.ZeroCurvature:
          iPrev = index;
          tPrev = currentAt;
          break;
        default:
          throw new Error('Unsupported interpolation ending mode.');
      }
    }

    if (tNext === undefined) {
      switch (this.endingEnd) {
        case InterpolationEndingMode.ZeroSlope:
          iNext = index;
          tNext = 2 * currentAt - previousAt;
          break;
        case InterpolationEndingMode.WrapAround:
          iNext = 1;
          tNext = currentAt + pp[1] - pp[0];
          break;
        case InterpolationEndingMode.ZeroCurvature:
          iNext = index - 1;
          tNext = previousAt;
          break;
        default:
          throw new Error('Unsupported interpolation ending mode.');
      }
    }

    const halfDt = (currentAt - previousAt) * 0.5;
    const stride = this.valueSize;

    this._weightPrev = halfDt / (previousAt - tPrev);
    this._weightNext = halfDt / (tNext - currentAt);
    this._offsetPrev = iPrev * stride;
    this._offsetNext = iNext * stride;
  }
}
