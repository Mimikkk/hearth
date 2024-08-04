import { TempNode } from '../core/TempNode.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { Node } from '../core/Node.js';

export class JoinNode extends TempNode {
  constructor(
    public nodes: Node[],
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

    const snippetValues = [];

    for (const input of nodes) {
      let inputSnippet = input.build(builder);

      const inputPrimitiveType = TypeName.component(input.getNodeType(builder));

      if (inputPrimitiveType !== primitiveType) {
        inputSnippet = builder.format(inputSnippet, inputPrimitiveType, primitiveType);
      }

      snippetValues.push(inputSnippet);
    }

    const snippet = `${TypeName.repr(type)}(${snippetValues.join(', ')})`;

    return builder.format(snippet, type, output);
  }
}


