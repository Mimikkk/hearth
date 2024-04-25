import { InterpolationMode } from '../../constants.js';
import { KeyframeTrack } from '../KeyframeTrack.js';

export class StringKeyframeTrack extends KeyframeTrack {}

StringKeyframeTrack.prototype.ValueTypeName = 'string';
StringKeyframeTrack.prototype.ValueBufferType = Array;
StringKeyframeTrack.prototype.DefaultInterpolation = InterpolationMode.Discrete;
StringKeyframeTrack.prototype.InterpolantFactoryMethodLinear = undefined!;
StringKeyframeTrack.prototype.InterpolantFactoryMethodSmooth = undefined!;
