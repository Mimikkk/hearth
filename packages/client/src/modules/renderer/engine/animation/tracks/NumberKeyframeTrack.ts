import { KeyframeTrack } from '../KeyframeTrack.js';
import { InterpolationMode } from '../../constants.js';

export class NumberKeyframeTrack extends KeyframeTrack {}

NumberKeyframeTrack.prototype.ValueTypeName = 'number';
NumberKeyframeTrack.prototype.ValueBufferType = Float32Array;
NumberKeyframeTrack.prototype.DefaultInterpolation = InterpolationMode.Linear;
