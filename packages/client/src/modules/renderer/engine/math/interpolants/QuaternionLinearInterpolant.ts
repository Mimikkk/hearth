import { Interpolant } from './Interpolant.js';
import { QuaternionArray } from '../Quaternion.js';
import type { TypedArray } from '../MathUtils.js';

export class QuaternionLinearInterpolant<T extends TypedArray = any, V extends TypedArray = any> extends Interpolant<
  T,
  V
> {
  override interpolate(index: number, previousAt: number, at: number, currentAt: number): V {
    const result = this.resultBuffer;
    const values = this.sampleValues;
    const stride = this.valueSize;
    const alpha = (at - previousAt) / (currentAt - previousAt);

    let offset = index * stride;

    for (let end = offset + stride; offset !== end; offset += 4) {
      QuaternionArray.slerp(result, 0, values, offset - stride, values, offset, alpha);
    }

    return result;
  }
}
