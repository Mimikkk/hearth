import { Node } from './Node.js';
import { proxyNode } from '../shadernode/ShaderNodes.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { implCommand } from '@modules/renderer/engine/nodes/core/Node.commands.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';

export class VarNode extends Node {
  constructor(
    public node: Node,
    public name?: string,
  ) {
    super();
  }

  isGlobal(): boolean {
    return true;
  }

  getHash(builder: NodeBuilder): string {
    return this.name || super.getHash(builder);
  }

  getNodeType(builder: NodeBuilder): TypeName {
    return this.node.getNodeType(builder);
  }

  generate(builder: NodeBuilder): string {
    const { node, name } = this;

    const type = TypeName.coerce(this.getNodeType(builder));

    const nodeVar = builder.getVarFromNode(this, name, type);

    const property = builder.getPropertyName(nodeVar);

    const snippet = node.build(builder, nodeVar.type);

    builder.addLineFlowCode(`${property} = ${snippet}`);

    return property;
  }
}

export const temp = proxyNode(VarNode);

export class ToVarNode extends VarNode {
  constructor(node: Node, name?: string) {
    super(node, name);
    this.append();
  }
}

implCommand('temp', VarNode);
implCommand('toVar', ToVarNode);
