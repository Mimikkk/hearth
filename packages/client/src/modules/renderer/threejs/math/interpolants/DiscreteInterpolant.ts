import { Interpolant } from '../Interpolant.js';
import type { TypedArray } from '../MathUtils.js';

export class DiscreteInterpolant<T extends TypedArray, V extends TypedArray> extends Interpolant<T, V> {
  constructor(parameterPositions: T, sampleValues: V, valueSize: number, resultBuffer?: V) {
    super(parameterPositions, sampleValues, valueSize, resultBuffer);
  }

  interpolate_(i1: number): V {
    return this.copySampleValue_(i1 - 1);
  }
}
