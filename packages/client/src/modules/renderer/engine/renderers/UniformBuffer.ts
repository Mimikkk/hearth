import NodeBuffer from './NodeBuffer.js';

export class UniformBuffer extends NodeBuffer {
  declare isUniformBuffer: true;
}

UniformBuffer.prototype.isUniformBuffer = true;

export default UniformBuffer;
