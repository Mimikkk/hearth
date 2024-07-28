import BindingStorageBuffer from '../../renderers/bindings/BindingStorageBuffer.js';
import NodeUniform from '@modules/renderer/engine/nodes/core/NodeUniform.js';

let _id = 0;

export class NodeStorageBuffer extends BindingStorageBuffer {
  nodeUniform: NodeUniform;

  constructor(nodeUniform: NodeUniform) {
    super('StorageBuffer_' + _id++, nodeUniform.value);

    this.nodeUniform = nodeUniform;
  }
}

export default NodeStorageBuffer;
