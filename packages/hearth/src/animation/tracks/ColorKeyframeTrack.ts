import { KeyframeTrack } from '../KeyframeTrack.js';
import { InterpolationMode } from '../../constants.js';

export class ColorKeyframeTrack extends KeyframeTrack {}

ColorKeyframeTrack.prototype.ValueTypeName = 'vector';
ColorKeyframeTrack.prototype.ValueBufferType = Float32Array;
ColorKeyframeTrack.prototype.DefaultInterpolation = InterpolationMode.Linear;
