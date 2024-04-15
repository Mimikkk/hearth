import { InterpolationMode } from '../../constants.ts';
import { KeyframeTrack } from '../KeyframeTrack.js';

/**
 * A Track that interpolates Strings
 */
class StringKeyframeTrack extends KeyframeTrack {}

StringKeyframeTrack.prototype.ValueTypeName = 'string';
StringKeyframeTrack.prototype.ValueBufferType = Array;
StringKeyframeTrack.prototype.DefaultInterpolation = InterpolationMode.Discrete;
StringKeyframeTrack.prototype.InterpolantFactoryMethodLinear = undefined;
StringKeyframeTrack.prototype.InterpolantFactoryMethodSmooth = undefined;

export { StringKeyframeTrack };
