import type { TypedArray } from '../../math/MathUtils.js';
import { GPUVertexStepModeType } from '@modules/renderer/engine/renderers/webgpu/utils/constants.js';

export class Buffer<T extends TypedArray = any> {
  declare isInterleavedBuffer: true;
  array: T;
  stride: number;
  type: GPUVertexStepModeType;

  constructor(array: T, stride: number = 1) {
    this.array = array;
    this.stride = stride;
  }

  get count(): number {
    return this.array.length / this.stride;
  }
}

Buffer.prototype.isInterleavedBuffer = true;
