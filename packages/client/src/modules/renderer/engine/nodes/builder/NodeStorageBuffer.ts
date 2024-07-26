import StorageBuffer from '../core/StorageBuffer.js';
import NodeUniform from '@modules/renderer/engine/nodes/core/NodeUniform.js';

let _id = 0;

export class NodeStorageBuffer extends StorageBuffer {
  nodeUniform: NodeUniform;

  constructor(nodeUniform: NodeUniform) {
    super('StorageBuffer_' + _id++, nodeUniform ? nodeUniform.value : null);

    this.nodeUniform = nodeUniform;
  }

  get buffer() {
    return this.nodeUniform.value;
  }
}

export default NodeStorageBuffer;
