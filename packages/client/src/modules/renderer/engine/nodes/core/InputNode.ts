import { Node } from './Node.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';

export abstract class InputNode<T = any> extends Node {
  protected constructor(
    public value: T,
    type: TypeName = TypeName.ofValue(value),
  ) {
    super(type);
  }

  getNodeType(): TypeName {
    if (!this.nodeType) return TypeName.ofValue(this.value)!;
    return this.nodeType;
  }

  getInputType(builder: NodeBuilder) {
    return this.getNodeType(builder);
  }

  abstract generate(builder: NodeBuilder, output: TypeName): string;
}
