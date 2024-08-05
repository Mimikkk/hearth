import { Node } from './Node.js';
import { getValueType } from './NodeUtils.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';

export abstract class InputNode<T = any> extends Node {
  protected constructor(
    public value: T,
    type: TypeName = getValueType(value),
  ) {
    super(type);
  }

  getNodeType(builder: NodeBuilder): TypeName {
    if (!this.nodeType) return getValueType(this.value)!;
    return this.nodeType;
  }

  getInputType(builder: NodeBuilder) {
    return this.getNodeType(builder);
  }

  abstract generate(builder: NodeBuilder, output: TypeName): string;
}
