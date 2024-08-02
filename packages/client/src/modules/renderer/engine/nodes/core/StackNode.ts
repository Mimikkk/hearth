import { Node } from './Node.js';
import { cond } from '../math/CondNode.js';
import { proxyNode, NodeStack, ShaderNode } from '../shadernode/ShaderNodes.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { CondNode } from 'three/examples/jsm/nodes/math/CondNode.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { OperatorNode } from '@modules/renderer/engine/nodes/Nodes.js';

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

  if(bool: OperatorNode, then: Function) {
    this.cond = cond(bool, new ShaderNode(then));

    return this.add(this.cond);
  }

  elseif(boolNode, method) {
    const methodNode = new ShaderNode(method);
    const ifNode = cond(boolNode, methodNode);

    this.cond.invalid = ifNode;
    this.cond = ifNode;

    return this;
  }

  else(method) {
    this.cond.elseNode = new ShaderNode(method);

    return this;
  }

  build(builder, ...params) {
    const previousStack = NodeStack.get();

    NodeStack.set(this);

    for (const node of this.nodes) {
      node.build(builder, TypeName.void);
    }

    NodeStack.set(previousStack);

    return this.outputNode ? this.outputNode.build(builder, ...params) : super.build(builder, ...params);
  }
}

StackNode.prototype.isStackNode = true;

export default StackNode;

export const stack = proxyNode(StackNode);
