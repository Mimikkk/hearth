import { InterleavedBuffer } from './InterleavedBuffer.js';
import { TypedArray } from '../../math/MathUtils.js';

export class InstancedInterleavedBuffer<T extends TypedArray> extends InterleavedBuffer<T> {
  declare isInstancedInterleavedBuffer: true;
}

InstancedInterleavedBuffer.prototype.isInstancedInterleavedBuffer = true;
