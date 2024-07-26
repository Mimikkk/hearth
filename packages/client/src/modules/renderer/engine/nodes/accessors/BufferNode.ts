import UniformNode from '../core/UniformNode.js';
import { asNode } from '../shadernode/ShaderNodes.js';

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

export const buffer = (value, type, count) => asNode(new BufferNode(value, type, count));
