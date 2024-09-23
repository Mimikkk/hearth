import { Node } from '../core/Node.js';
import { TypeName } from '../../nodes/builder/NodeBuilder.types.js';
import { NodeBuilder } from '../../nodes/builder/NodeBuilder.js';

export class SplitNode extends Node {
  declare isSplitNode: true;

  constructor(
    public node: Node,
    public components: string,
  ) {
    super();
  }

  getVectorLength() {
    let len = this.components.length;

    for (const c of this.components) {
      len = Math.max('xyzw'.indexOf(c) + 1, len);
    }

    return len;
  }

  getComponentType(builder: NodeBuilder): TypeName {
    return TypeName.component(this.node.getNodeType(builder));
  }

  getNodeType(builder: NodeBuilder): TypeName {
    return TypeName.ofSize(this.components.length, this.getComponentType(builder));
  }

  generate(builder: NodeBuilder, output?: TypeName): string {
    const node = this.node;
    const nodeTypeLength = TypeName.size(node.getNodeType(builder));

    let snippet = null;

    if (nodeTypeLength > 1) {
      let type = null;

      const componentsLength = this.getVectorLength();

      if (componentsLength >= nodeTypeLength) {
        type = TypeName.ofSize(this.getVectorLength(), this.getComponentType(builder));
      }

      const nodeSnippet = node.build(builder, type);

      if (this.components.length === nodeTypeLength && this.components === 'xyzw'.slice(0, this.components.length)) {
        snippet = builder.format(nodeSnippet, type, output);
      } else {
        snippet = builder.format(`${nodeSnippet}.${this.components}`, this.getNodeType(builder), output);
      }
    } else {
      snippet = node.build(builder, output);
    }

    return snippet;
  }
}

SplitNode.prototype.isSplitNode = true;
Node.Map.split = SplitNode;
