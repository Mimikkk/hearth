import { TypedArray } from '../../math/MathUtils.js';
import { Buffer } from '@modules/renderer/engine/core/buffers/Buffer.js';
import { BufferAttribute } from '@modules/renderer/engine/core/attributes/BufferAttribute.js';
import { GPUBufferBindingTypeType, GPUVertexStepModeType } from '@modules/renderer/engine/renderers/utils/constants.js';

export class InterleavedBufferAttribute<T extends TypedArray = any> extends BufferAttribute<T> {
  data: Buffer<T>;

  constructor(
    buffer: Buffer,
    itemSize: number,
    offset: number,
    step?: GPUVertexStepModeType,
    bind?: GPUBufferBindingTypeType,
  ) {
    super(buffer.array, itemSize, offset, step, bind, true);
    this.data = buffer;

    return new Proxy(this, {
      get: (target, prop) => {
        if (prop === 'data') traceOnce(prop, target, prop);
        return target[prop];
      },
    });
  }
}

const thrown = new Set<string>();
const traceOnce = (message: string, ...args: any[]) => {
  if (thrown.has(message)) return;
  thrown.add(message);

  console.trace({ message, ...args });
};
