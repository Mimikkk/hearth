import { asNode } from '../shadernode/ShaderNodes.js';
import PropertyNode from './PropertyNode.js';

export class ParameterNode extends PropertyNode {
  constructor(nodeType, name = null) {
    super(nodeType, name);

    this.isParameterNode = true;
  }

  getHash() {
    return this.uuid;
  }

  generate() {
    return this.name;
  }
}

export default ParameterNode;

export const parameter = (type, name) => asNode(new ParameterNode(type, name));
