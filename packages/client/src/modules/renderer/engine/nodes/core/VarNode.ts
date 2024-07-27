import { Node } from './Node.js';
import { addNodeElement, proxyNode } from '../shadernode/ShaderNodes.js';

class VarNode extends Node {
  static type = 'VarNode';

  constructor(node, name = null) {
    super();

    this.node = node;
    this.name = name;

    this.isVarNode = true;
  }

  isGlobal() {
    return true;
  }

  getHash(builder) {
    return this.name || super.getHash(builder);
  }

  getNodeType(builder) {
    return this.node.getNodeType(builder);
  }

  generate(builder) {
    const { node, name } = this;

    const nodeVar = builder.getVarFromNode(this, name, builder.getVectorType(this.getNodeType(builder)));

    const propertyName = builder.getPropertyName(nodeVar);

    const snippet = node.build(builder, nodeVar.type);

    builder.addLineFlowCode(`${propertyName} = ${snippet}`);

    return propertyName;
  }
}

export default VarNode;

export const temp = proxyNode(VarNode);

addNodeElement('temp', temp);
addNodeElement('toVar', (...params) => temp(...params).append());
