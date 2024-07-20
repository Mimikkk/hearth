import { Interpolant } from '../Interpolant.js';
import { Quaternion } from '../Quaternion.js';
import type { TypedArray } from '../MathUtils.js';

export class QuaternionLinearInterpolant<T extends TypedArray, V extends TypedArray> extends Interpolant<T, V> {
  constructor(parameterPositions: T, sampleValues: V, valueSize: number, resultBuffer?: V) {
    super(parameterPositions, sampleValues, valueSize, resultBuffer);
  }

  override interpolate_(i1: number, t0: number, t: number, t1: number): V {
    const result = this.resultBuffer;
    const values = this.sampleValues;
    const stride = this.valueSize;
    const alpha = (t - t0) / (t1 - t0);

    let offset = i1 * stride;

    for (let end = offset + stride; offset !== end; offset += 4) {
      Quaternion.slerpFlat(result, 0, values, offset - stride, values, offset, alpha);
    }

    return result;
  }
}
