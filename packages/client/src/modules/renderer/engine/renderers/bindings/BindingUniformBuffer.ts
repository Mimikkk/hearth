import BindingBuffer from './BindingBuffer.js';

export class BindingUniformBuffer extends BindingBuffer {
  declare isUniformBuffer: true;
}

BindingUniformBuffer.prototype.isUniformBuffer = true;

export default BindingUniformBuffer;
