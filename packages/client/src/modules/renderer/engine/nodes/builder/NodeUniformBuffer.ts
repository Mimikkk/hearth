import BindingUniformBuffer from '../../renderers/bindings/BindingUniformBuffer.js';
import NodeUniform from '@modules/renderer/engine/nodes/core/NodeUniform.js';

let _id = 0;

class NodeUniformBuffer extends BindingUniformBuffer {
  nodeUniform: NodeUniform;

  constructor(nodeUniform: NodeUniform) {
    super('UniformBuffer_' + _id++, nodeUniform.value);

    this.nodeUniform = nodeUniform;
  }
}

export default NodeUniformBuffer;
