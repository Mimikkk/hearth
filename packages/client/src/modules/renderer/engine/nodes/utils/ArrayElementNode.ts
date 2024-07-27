import { Node } from '../core/Node.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

export class ArrayElementNode extends Node {
  static type = 'ArrayElementNode';

  constructor(
    public array: Node,
    public index: Node,
  ) {
    super();
  }

  getNodeType(builder: NodeBuilder): TypeName {
    return this.array.getNodeType(builder);
  }

  generate(builder: NodeBuilder): string {
    const array = this.array.build(builder);
    const index = this.index.build(builder, TypeName.u32);

    return `${array}[${index}]`;
  }
}

export default ArrayElementNode;
