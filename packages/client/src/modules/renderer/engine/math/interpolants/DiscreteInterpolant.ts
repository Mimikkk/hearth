import { Interpolant } from './Interpolant.js';
import type { TypedArray } from '../MathUtils.js';

export class DiscreteInterpolant<T extends TypedArray, V extends TypedArray> extends Interpolant<T, V> {
  interpolate(index: number): V {
    return this.copySampleValue(index - 1);
  }
}
