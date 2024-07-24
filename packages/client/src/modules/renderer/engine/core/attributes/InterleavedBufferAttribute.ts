import { TypedArray } from '../../math/MathUtils.js';
import { Buffer } from '@modules/renderer/engine/core/buffers/Buffer.js';
import { BufferAttribute } from '@modules/renderer/engine/core/attributes/BufferAttribute.js';

export class InterleavedBufferAttribute<T extends TypedArray = any> extends BufferAttribute<T> {
  declare isInterleavedBufferAttribute: true;
  data: Buffer<T>;

  constructor(buffer: Buffer, itemSize: number, offset: number) {
    super(buffer.array, itemSize, offset);
    this.data = buffer;
  }
}

InterleavedBufferAttribute.prototype.isInterleavedBufferAttribute = true;
