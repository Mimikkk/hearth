import BindingBuffer from './BindingBuffer.js';

export class UniformBuffer extends BindingBuffer {
  declare isUniformBuffer: true;
}

UniformBuffer.prototype.isUniformBuffer = true;

export default UniformBuffer;
