import { Node } from './Node.js';
import { cond } from '../math/CondNode.js';
import { proxyNode, NodeStack, ShaderNode } from '../shadernode/ShaderNodes.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import CondNode from 'three/examples/jsm/nodes/math/CondNode.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { OperatorNode } from '@modules/renderer/engine/nodes/Nodes.js';

export class StackNode extends Node {
  static type = 'StackNode';
  outputNode: Node | null;
  nodes: Node[];
  _currentCond: CondNode | null;
  declare isStackNode: boolean;

  constructor(public parent: Node | null = null) {
    super();

    this.nodes = [];
    this.outputNode = null;
    this._currentCond = null;
  }

  getNodeType(builder: NodeBuilder): TypeName {
    return this.outputNode ? this.outputNode.getNodeType(builder) : TypeName.void;
  }

  add(node) {
    this.nodes.push(node);

    return this;
  }

  if(boolNode: OperatorNode, method: Function) {
    const methodNode = new ShaderNode(method);
    this._currentCond = cond(boolNode, methodNode);

    return this.add(this._currentCond);
  }

  elseif(boolNode, method) {
    const methodNode = new ShaderNode(method);
    const ifNode = cond(boolNode, methodNode);

    this._currentCond.elseNode = ifNode;
    this._currentCond = ifNode;

    return this;
  }

  else(method) {
    this._currentCond.elseNode = new ShaderNode(method);

    return this;
  }

  build(builder, ...params) {
    const previousStack = NodeStack.get();

    NodeStack.set(this);

    for (const node of this.nodes) {
      node.build(builder, 'void');
    }

    NodeStack.set(previousStack);

    return this.outputNode ? this.outputNode.build(builder, ...params) : super.build(builder, ...params);
  }
}

StackNode.prototype.isStackNode = true;

export default StackNode;

export const stack = proxyNode(StackNode);
