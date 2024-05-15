import Binding from './Binding.js';
import { getFloatLength } from './BufferUtils.js';

export class Buffer extends Binding {
  declare isBuffer: true;
  declare bytesPerElement: number;
  _buffer: Float32Array | null = null;

  constructor(name: string, buffer: Float32Array) {
    super(name);

    this._buffer = buffer;
  }

  get byteLength() {
    return getFloatLength(this._buffer!.byteLength);
  }

  get buffer() {
    return this._buffer;
  }

  update() {
    return true;
  }
}

Buffer.prototype.isBuffer = true;
Buffer.prototype.bytesPerElement = Float32Array.BYTES_PER_ELEMENT;

export default Buffer;
