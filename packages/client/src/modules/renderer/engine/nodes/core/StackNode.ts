import { Node } from './Node.js';
import CondNode, { cond } from '../math/CondNode.js';
import { createShaderNode, NodeStack, proxyNode, ShaderNode } from '../shadernode/ShaderNodes.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import OperatorNode from '@modules/renderer/engine/nodes/math/OperatorNode.js';

export class StackNode extends Node {
  static type = 'StackNode';
  outputNode: Node | null;
  nodes: Node[];
  cond: CondNode | null;
  declare isStackNode: boolean;

  constructor(public parent: StackNode | null = null) {
    super();

    this.nodes = [];
    this.outputNode = null;
    this.cond = null;
  }

  getNodeType(builder: NodeBuilder): TypeName {
    return this.outputNode ? this.outputNode.getNodeType(builder) : TypeName.void;
  }

  add(node: Node): this {
    this.nodes.push(node);

    return this;
  }

  if(bool: OperatorNode, then: Function): this {
    this.cond = cond(bool, createShaderNode(then));

    return this.add(this.cond);
  }

  elseif(bool: OperatorNode, then: Function): this {
    const condition = cond(bool, createShaderNode(then));

    this.cond!.invalid = condition;
    this.cond = condition;

    return this;
  }

  else(method: Function): this {
    this.cond!.invalid = createShaderNode(method);

    return this;
  }

  build(builder: NodeBuilder, output?: TypeName): string {
    const stack = NodeStack.get();

    NodeStack.set(this);
    for (const node of this.nodes) {
      node.build(builder, TypeName.void);
    }
    NodeStack.set(stack);

    return this.outputNode ? this.outputNode.build(builder, output) : super.build(builder, output);
  }
}

StackNode.prototype.isStackNode = true;

export default StackNode;

export const stack = proxyNode(StackNode);
