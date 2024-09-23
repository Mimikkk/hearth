import { TypeName } from '../../nodes/builder/NodeBuilder.types.js';
import { BufferNode } from '../../nodes/accessors/BufferNode.js';

export class NodeAttribute {
  constructor(
    public name: string,
    public type: TypeName,
    public node: BufferNode<any> | null = null,
  ) {}
}
