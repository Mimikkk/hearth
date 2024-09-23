import { KeyframeTrack } from '../KeyframeTrack.js';
import { InterpolationMode } from '../../constants.js';

export class VectorKeyframeTrack extends KeyframeTrack {}

VectorKeyframeTrack.prototype.ValueTypeName = 'vector';
VectorKeyframeTrack.prototype.ValueBufferType = Float32Array;
VectorKeyframeTrack.prototype.DefaultInterpolation = InterpolationMode.Linear;
