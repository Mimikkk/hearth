import { Node } from './Node.js';
import { createShaderNode, NodeStack, proxyNode } from '../shadernode/ShaderNodes.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { OperatorNode } from '@modules/renderer/engine/nodes/math/OperatorNode.js';
import type { CondNode } from '@modules/renderer/engine/nodes/math/CondNode.js';

export class StackNode extends Node {
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

  push(node: Node): this {
    this.nodes.push(node);

    return this;
  }

  if(bool: OperatorNode, then: Function): this {
    const cond = Node.Map.cond;

    this.cond = new cond(bool, createShaderNode(then));

    return this.push(this.cond);
  }

  elseif(bool: OperatorNode, then: Function): this {
    const cond = Node.Map.cond;

    const condition = new cond(bool, createShaderNode(then));

    this.cond!.or = condition;
    this.cond = condition;

    return this;
  }

  else(method: Function): this {
    this.cond!.or = createShaderNode(method);

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

  assign(): this {
    throw new Error('Inheritance is always a mistake.');
  }
}

StackNode.prototype.isStackNode = true;
Node.Stack = StackNode;

export const stack = proxyNode(StackNode);
