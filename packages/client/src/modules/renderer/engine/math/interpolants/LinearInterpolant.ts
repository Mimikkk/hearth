import { Interpolant } from './Interpolant.js';
import type { TypedArray } from '../MathUtils.js';

export class LinearInterpolant<T extends TypedArray, V extends TypedArray> extends Interpolant<T, V> {
  override interpolate(index: number, previousAt: number, targetAt: number, currentAt: number): V {
    const { resultBuffer: result, sampleValues: values, valueSize: stride } = this;

    const offset1 = index * stride;
    const offset0 = offset1 - stride;
    const weight1 = (targetAt - previousAt) / (currentAt - previousAt);
    const weight0 = 1 - weight1;

    for (let i = 0; i !== stride; ++i) {
      result[i] = values[offset0 + i] * weight0 + values[offset1 + i] * weight1;
    }

    return result;
  }
}
