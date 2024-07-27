import { Interpolant } from './Interpolant.js';
import type { TypedArray } from '../MathUtils.js';

export class CubicSplineInterpolant<T extends TypedArray = any, V extends TypedArray = any> extends Interpolant<T, V> {
  override copySampleValue(index: number): V {
    const result = this.resultBuffer;
    const values = this.sampleValues;
    const stride = this.valueSize;

    const offset = index * stride * 3 + stride;
    for (let i = 0; i !== stride; i++) {
      result[i] = values[offset + i];
    }

    return result;
  }

  override interpolate(index: number, previousAt: number, at: number, currentAt: number): V {
    const result = this.resultBuffer;
    const values = this.sampleValues;
    const stride = this.valueSize;
    const stride2 = stride * 2;
    const stride3 = stride * 3;

    const td = currentAt - previousAt;

    const p = (at - previousAt) / td;
    const pp = p * p;
    const ppp = pp * p;

    const offset1 = index * stride3;
    const offset0 = offset1 - stride3;

    const s2 = -2 * ppp + 3 * pp;
    const s3 = ppp - pp;
    const s0 = 1 - s2;
    const s1 = s3 - pp + p;

    for (let i = 0; i !== stride; i++) {
      const splineVertexK0 = values[offset0 + i + stride];
      const outTangentK0 = values[offset0 + i + stride2] * td;
      const splineVertexK1 = values[offset1 + i + stride];
      const putTangentK1 = values[offset1 + i] * td;

      result[i] = s0 * splineVertexK0 + s1 * outTangentK0 + s2 * splineVertexK1 + s3 * putTangentK1;
    }

    return result;
  }
}
