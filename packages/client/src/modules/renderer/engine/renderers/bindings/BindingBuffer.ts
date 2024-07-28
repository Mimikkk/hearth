import Binding from './Binding.js';
import { getFloatLength } from '../BufferUtils.js';
import { TypedArray } from '@modules/renderer/engine/math/MathUtils.js';

export class BindingBuffer extends Binding {
  declare isBuffer: true;
  declare bytesPerElement: number;
  _buffer: TypedArray;

  constructor(name: string, buffer: TypedArray) {
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

BindingBuffer.prototype.isBuffer = true;
BindingBuffer.prototype.bytesPerElement = Float32Array.BYTES_PER_ELEMENT;

export default BindingBuffer;
