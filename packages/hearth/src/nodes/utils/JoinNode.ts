import { TempNode } from '../core/TempNode.js';
import { TypeName } from '../../nodes/builder/NodeBuilder.types.js';
import { NodeBuilder } from '../../nodes/builder/NodeBuilder.js';
import { ConstNode } from '../../nodes/core/ConstNode.js';

export class JoinNode extends TempNode {
  constructor(
    public nodes: ConstNode<number>[],
    type: TypeName,
  ) {
    super(type);
  }

  getNodeType(builder: NodeBuilder): TypeName {
    if (this.nodeType) return TypeName.coerce(this.nodeType);

    let size = 0;
    for (const node of this.nodes) {
      size += TypeName.size(node.getNodeType(builder));
    }

    return TypeName.ofSize(size, TypeName.f32);
  }

  generate(builder: NodeBuilder, output: TypeName): string {
    const type = this.getNodeType(builder);
    const nodes = this.nodes;

    const primitiveType = TypeName.component(type);

    const codes = [];

    for (const input of nodes) {
      let code = input.build(builder);

      const type = TypeName.component(input.getNodeType(builder));

      if (type !== primitiveType) {
        code = builder.format(code, type, primitiveType);
      }

      codes.push(code);
    }

    const snippet = `${TypeName.repr(type)}(${codes.join(', ')})`;

    return builder.format(snippet, type, output);
  }
}
