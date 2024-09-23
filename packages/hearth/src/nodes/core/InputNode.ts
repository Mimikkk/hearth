import { Node } from './Node.js';
import { TypeName } from '../../nodes/builder/NodeBuilder.types.js';
import type { NodeBuilder } from '../../nodes/builder/NodeBuilder.js';

export abstract class InputNode<T = any> extends Node {
  protected constructor(
    public value: T,
    type: TypeName = TypeName.ofValue(value),
  ) {
    super(type);
  }

  getNodeType(builder: NodeBuilder): TypeName {
    if (!this.nodeType) return TypeName.ofValue(this.value)!;
    return this.nodeType;
  }

  getInputType(builder: NodeBuilder) {
    return this.getNodeType(builder);
  }

  abstract generate(builder: NodeBuilder, output: TypeName): string;
}
