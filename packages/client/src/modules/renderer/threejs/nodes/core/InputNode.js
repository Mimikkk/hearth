import Node, { addNodeClass } from './Node.ts';
import { arrayBufferToBase64, getValueFromType, getValueType } from './NodeUtils.js';

class InputNode extends Node {
  constructor(value, nodeType = null) {
    super(nodeType);

    this.isInputNode = true;

    this.value = value;
    this.precision = null;
  }

  getNodeType(/*builder*/) {
    if (this.nodeType === null) {
      return getValueType(this.value);
    }

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

addNodeClass('InputNode', InputNode);
