import { addNodeCommand, proxyNode } from '../shadernode/ShaderNodes.js';
import ArrayElementNode from './ArrayElementNode.js';

class StorageArrayElementNode extends ArrayElementNode {
  static type = 'StorageArrayElementNode';

  constructor(storageBufferNode, indexNode) {
    super(storageBufferNode, indexNode);

    this.isStorageArrayElementNode = true;
  }

  set storageBufferNode(value) {
    this.array = value;
  }

  get storageBufferNode() {
    return this.array;
  }

  setup(builder) {
    if (builder.isAvailable('storageBuffer') === false) {
      if (!this.array.instanceIndex && this.array.bufferObject === true) {
        builder.setupPBO(this.array);
      }
    }

    return super.setup(builder);
  }

  generate(builder, output) {
    let snippet;

    const isAssignContext = builder.context.assign;

    if (builder.isAvailable('storageBuffer') === false) {
      const { array } = this;

      if (!array.instanceIndex && this.array.bufferObject === true && isAssignContext !== true) {
        snippet = builder.generatePBO(this);
      } else {
        snippet = array.build(builder);
      }
    } else {
      snippet = super.generate(builder);
    }

    if (isAssignContext !== true) {
      const type = this.getNodeType(builder);

      snippet = builder.format(snippet, type, output);
    }

    return snippet;
  }
}

export default StorageArrayElementNode;

export const storageElement = proxyNode(StorageArrayElementNode);

addNodeCommand('storageElement', storageElement);
