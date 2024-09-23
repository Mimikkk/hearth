import { Quaternion } from '../Quaternion.js';
import type { TypedArray } from '../MathUtils.js';
import { CubicSplineInterpolant } from './CubicSplineInterpolant.js';

export class CubicSplineQuaternionInterpolant<
  T extends TypedArray = any,
  V extends TypedArray = any,
> extends CubicSplineInterpolant<T, V> {
  override interpolate(index: number, previousAt: number, at: number, currentAt: number): V {
    const result = super.interpolate(index, previousAt, at, currentAt);

    _q.fromArray(result).normalize().intoArray(result);

    return result;
  }
}

const _q = Quaternion.new();
