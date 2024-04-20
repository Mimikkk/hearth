import { Interpolant } from '../Interpolant.js';
import type { TypedArray } from '../MathUtils.js';

export class LinearInterpolant<T extends TypedArray> extends Interpolant<T> {
  constructor(parameterPositions: number[], sampleValues: T, valueSize: number, resultBuffer?: T) {
    super(parameterPositions, sampleValues, valueSize, resultBuffer);
  }

  override interpolate_(i1: number, t0: number, t: number, t1: number): T {
    const result = this.resultBuffer;
    const values = this.sampleValues;
    const stride = this.valueSize;
    const offset1 = i1 * stride;
    const offset0 = offset1 - stride;
    const weight1 = (t - t0) / (t1 - t0);
    const weight0 = 1 - weight1;

    for (let i = 0; i !== stride; ++i) {
      result[i] = values[offset0 + i] * weight0 + values[offset1 + i] * weight1;
    }

    return result;
  }
}
