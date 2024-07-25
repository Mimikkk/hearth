import { TypedArray } from '../../math/MathUtils.js';
import { Buffer } from '@modules/renderer/engine/core/buffers/Buffer.js';
import { BufferAttribute } from '@modules/renderer/engine/core/attributes/BufferAttribute.js';
import { GPUBufferBindingTypeType, GPUVertexStepModeType } from '@modules/renderer/engine/renderers/utils/constants.js';

export class InterleavedBufferAttribute<T extends TypedArray = any> extends BufferAttribute<T> {
  constructor(
    buffer: Buffer<T>,
    span: number,
    offset: number,
    step?: GPUVertexStepModeType,
    bind?: GPUBufferBindingTypeType,
  ) {
    super(buffer, span, offset, step, bind, true);
  }
}
