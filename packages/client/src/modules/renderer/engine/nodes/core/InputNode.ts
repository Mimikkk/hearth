import Node from './Node.js';
import { getValueType } from './NodeUtils.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';

class InputNode<T = any> extends Node {
  static type = 'InputNode';
  declare isInputNode: true;

  constructor(
    public value: T,
    type: TypeName | null = getValueType(value),
  ) {
    super(type);

    this.value = value;
  }

  static isInputNode(node: any): node is InputNode {
    return node?.isInputNode === true;
  }

  getNodeType(builder: NodeBuilder): TypeName {
    if (this.nodeType === null) return getValueType(this.value)!;
    return this.nodeType;
  }

  getInputType(builder: NodeBuilder) {
    return this.getNodeType(builder);
  }

  generate(builder: NodeBuilder, output: any) {
    console.warn('Abstract function.');
  }
}

InputNode.prototype.isInputNode = true;

export default InputNode;
