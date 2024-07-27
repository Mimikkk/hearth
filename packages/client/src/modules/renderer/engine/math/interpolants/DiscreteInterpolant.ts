import { Interpolant } from './Interpolant.js';
import type { TypedArray } from '../MathUtils.js';

export class DiscreteInterpolant<T extends TypedArray = any, V extends TypedArray = any> extends Interpolant<T, V> {
  interpolate(index: number): V {
    return this.copySampleValue(index - 1);
  }
}
