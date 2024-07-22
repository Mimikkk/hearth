import Node from './Node.js';
import { getValueType } from './NodeUtils.js';
import { TypeName } from '@modules/renderer/engine/renderers/webgpu/nodes/NodeBuilder.types.js';

class InputNode<T = any> extends Node {
  static type = 'InputNode';

  constructor(
    public value: T,
    nodeType: TypeName = getValueType(value),
  ) {
    super(nodeType);

    this.isInputNode = true;

    this.value = value;
    this.precision = null;
  }

  getNodeType() {
    if (this.nodeType === null) return getValueType(this.value);

    return this.nodeType;
  }

  getInputType(builder) {
    return this.getNodeType(builder);
  }

  setPrecision(precision) {
    this.precision = precision;

    return this;
  }

  generate(/*builder, output*/) {
    console.warn('Abstract function.');
  }
}

export default InputNode;
