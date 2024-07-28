import BindingStorageBuffer from '../../renderers/bindings/BindingStorageBuffer.js';
import Uniform from '@modules/renderer/engine/nodes/core/Uniform.js';

let _id = 0;

export class NodeStorageBuffer extends BindingStorageBuffer {
  nodeUniform: Uniform;

  constructor(nodeUniform: Uniform) {
    super('StorageBuffer_' + _id++, nodeUniform.value);

    this.nodeUniform = nodeUniform;
  }
}

export default NodeStorageBuffer;
