import Buffer from './Buffer.js';

export class UniformBuffer extends Buffer {
  declare isUniformBuffer: true;
}

UniformBuffer.prototype.isUniformBuffer = true;

export default UniformBuffer;
