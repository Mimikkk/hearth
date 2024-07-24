import { Buffer } from './Buffer.js';
import { TypedArray } from '../../math/MathUtils.js';

export class InstancedInterleavedBuffer<T extends TypedArray> extends Buffer<T> {
  declare isInstancedInterleavedBuffer: true;
}

InstancedInterleavedBuffer.prototype.isInstancedInterleavedBuffer = true;
