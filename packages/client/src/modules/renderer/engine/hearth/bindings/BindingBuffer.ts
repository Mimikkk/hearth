import Binding from './Binding.js';
import { TypedArray } from '@modules/renderer/engine/math/MathUtils.js';
import { STD140ChunkBytes } from '@modules/renderer/engine/hearth/constants.js';

export const ensureSize = (size: number): number =>
  size + ((STD140ChunkBytes - (size % STD140ChunkBytes)) % STD140ChunkBytes);

export class BindingBuffer extends Binding {
  declare isBuffer: true;
  declare bytesPerElement: number;

  constructor(name: string, buffer: TypedArray) {
    super(name);

    this.buffer = buffer;
  }

  static is(value: any): value is BindingBuffer {
    return value?.isBuffer === true;
  }

  get byteLength() {
    return ensureSize(this.buffer.byteLength);
  }

  update() {
    return true;
  }
}

BindingBuffer.prototype.isBuffer = true;
BindingBuffer.prototype.bytesPerElement = Float32Array.BYTES_PER_ELEMENT;

export default BindingBuffer;
