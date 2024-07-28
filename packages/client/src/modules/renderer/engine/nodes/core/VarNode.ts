import { Node } from './Node.js';
import { addNodeCommand, proxyNode } from '../shadernode/ShaderNodes.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

class VarNode extends Node {
  static type = 'VarNode';

  constructor(node: Node, name: string = null) {
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

    const type = TypeName.coerce(this.getNodeType(builder));

    const nodeVar = builder.getVarFromNode(this, name, type);

    const propertyName = builder.getPropertyName(nodeVar);

    const snippet = node.build(builder, nodeVar.type);

    builder.addLineFlowCode(`${propertyName} = ${snippet}`);

    return propertyName;
  }
}

export default VarNode;

export const temp = proxyNode(VarNode);

addNodeCommand('temp', temp);
addNodeCommand('toVar', (...params) => temp(...params).append());
