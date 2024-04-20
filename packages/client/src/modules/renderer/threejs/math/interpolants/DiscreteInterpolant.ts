import { Interpolant } from '../Interpolant.js';
import type { TypedArray } from '@modules/renderer/threejs/math/MathUtils.js';

export class DiscreteInterpolant<T extends TypedArray> extends Interpolant<T> {
  constructor(parameterPositions: number[], sampleValues: T, valueSize: number, resultBuffer?: T) {
    super(parameterPositions, sampleValues, valueSize, resultBuffer);
  }

  interpolate_(i1: number): T {
    return this.copySampleValue_(i1 - 1);
  }
}
