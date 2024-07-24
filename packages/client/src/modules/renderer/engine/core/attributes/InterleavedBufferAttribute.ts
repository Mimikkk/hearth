import { TypedArray } from '../../math/MathUtils.js';
import { Buffer } from '@modules/renderer/engine/core/buffers/Buffer.js';
import { BufferAttribute } from '@modules/renderer/engine/core/attributes/BufferAttribute.js';

export class InterleavedBufferAttribute<T extends TypedArray = any> extends BufferAttribute<T> {
  declare isInterleavedBufferAttribute: true;
  data: Buffer<T>;

  constructor(buffer: Buffer, itemSize: number, offset: number) {
    super(buffer.array, itemSize, offset);
    this.data = buffer;

    return new Proxy(this, {
      get: (target, prop) => {
        if (prop === 'data') traceOnce(prop, target, prop);
        return target[prop];
      },
    });
  }
}

InterleavedBufferAttribute.prototype.isInterleavedBufferAttribute = true;

const thrown = new Set<string>();
const traceOnce = (message: string, ...args: any[]) => {
  if (thrown.has(message)) return;
  thrown.add(message);

  console.trace({ message, ...args });
};
