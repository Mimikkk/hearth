import UniformBuffer from '../../renderers/UniformBuffer.js';
import NodeUniform from '@modules/renderer/engine/nodes/core/NodeUniform.js';

let _id = 0;

class NodeUniformBuffer extends UniformBuffer {
  nodeUniform: NodeUniform;

  constructor(nodeUniform: NodeUniform) {
    super('UniformBuffer_' + _id++, nodeUniform ? nodeUniform.value : null);

    this.nodeUniform = nodeUniform;
  }

  get buffer() {
    return this.nodeUniform.value;
  }
}

export default NodeUniformBuffer;
