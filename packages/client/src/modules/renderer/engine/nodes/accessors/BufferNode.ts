import UniformNode from '../core/UniformNode.js';
import { nodeObject } from '../shadernode/ShaderNodes.js';

class BufferNode extends UniformNode {
  static type = 'BufferNode';

  constructor(value, bufferType, bufferCount = 0) {
    super(value, bufferType);

    this.isBufferNode = true;

    this.bufferType = bufferType;
    this.bufferCount = bufferCount;
  }

  getInputType(/*builder*/) {
    return 'buffer';
  }
}

export default BufferNode;

export const buffer = (value, type, count) => nodeObject(new BufferNode(value, type, count));
