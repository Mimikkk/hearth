import { InterpolationMode } from '../../constants.js';
import { KeyframeTrack } from '../KeyframeTrack.js';
import { QuaternionLinearInterpolant } from '../../math/interpolants/QuaternionLinearInterpolant.js';

export class QuaternionKeyframeTrack extends KeyframeTrack {
  InterpolantFactoryMethodLinear(result: Float32Array): QuaternionLinearInterpolant<Float32Array, Float32Array> {
    return new QuaternionLinearInterpolant(this.times, this.values, this.getValueSize(), result);
  }
}

QuaternionKeyframeTrack.prototype.ValueTypeName = 'quaternion';
QuaternionKeyframeTrack.prototype.ValueBufferType = Float32Array;
QuaternionKeyframeTrack.prototype.DefaultInterpolation = InterpolationMode.Linear;
QuaternionKeyframeTrack.prototype.InterpolantFactoryMethodSmooth = undefined!;
