import { Quaternion } from '../Quaternion.js';
import type { TypedArray } from '@modules/renderer/engine/math/MathUtils.js';
import { CubicSplineInterpolant } from '@modules/renderer/engine/math/interpolants/CubicSplineInterpolant.js';

export class CubicSplineQuaternionInterpolant<
  T extends TypedArray,
  V extends TypedArray,
> extends CubicSplineInterpolant<T, V> {
  override interpolate(index: number, previousAt: number, at: number, currentAt: number): V {
    const result = super.interpolate(index, previousAt, at, currentAt);

    _q.fromArray(result).normalize().intoArray(result);

    return result;
  }
}

const _q = Quaternion.new();
