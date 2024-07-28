import { TempNode } from '../core/TempNode.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { Node } from '../core/Node.js';

export class JoinNode extends TempNode {
  constructor(
    public nodes: Node[] = [],
    type: TypeName,
  ) {
    super(type);
  }

  getNodeType(builder: NodeBuilder): TypeName {
    if (this.nodeType !== null) {
      return builder.getVectorType(this.nodeType);
    }

    return builder.getTypeFromLength(
      this.nodes.reduce((count, cur) => count + builder.getTypeLength(cur.getNodeType(builder)), 0),
    );
  }

  generate(builder: NodeBuilder, output: TypeName): string {
    const type = this.getNodeType(builder);
    const nodes = this.nodes;

    const primitiveType = builder.getComponentType(type);

    const snippetValues = [];

    for (const input of nodes) {
      let inputSnippet = input.build(builder);

      const inputPrimitiveType = builder.getComponentType(input.getNodeType(builder));

      if (inputPrimitiveType !== primitiveType) {
        inputSnippet = builder.format(inputSnippet, inputPrimitiveType, primitiveType);
      }

      snippetValues.push(inputSnippet);
    }

    const snippet = `${builder.getType(type)}(${snippetValues.join(', ')})`;

    return builder.format(snippet, type, output);
  }
}

export default JoinNode;
