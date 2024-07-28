import BindingUniformBuffer from '../../renderers/bindings/BindingUniformBuffer.js';
import Uniform from '@modules/renderer/engine/nodes/core/Uniform.js';

let _id = 0;

class NodeUniformBuffer extends BindingUniformBuffer {
  nodeUniform: Uniform;

  constructor(nodeUniform: Uniform) {
    super('UniformBuffer_' + _id++, nodeUniform.value);

    this.nodeUniform = nodeUniform;
  }
}

export default NodeUniformBuffer;
