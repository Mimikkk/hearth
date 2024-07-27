import Node from '../core/Node.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import type { XYZW } from '@modules/renderer/engine/nodes/shadernode/ShaderNode.handlers.js';

const xyzw = 'xyzw';

export class SplitNode extends Node {
  declare isSplitNode: true;
  static type = 'SplitNode';

  constructor(
    public node: Node,
    public components: XYZW,
  ) {
    super();
  }

  getVectorLength(): number {
    return this.components.length;
  }

  getComponentType(builder: NodeBuilder): TypeName {
    return builder.getComponentType(this.node.getNodeType(builder));
  }

  getNodeType(builder: NodeBuilder): TypeName {
    return builder.getTypeFromLength(this.components.length, this.getComponentType(builder));
  }

  generate(builder: NodeBuilder, output: TypeName): string {
    const node = this.node;
    const nodeTypeLength = builder.getTypeLength(node.getNodeType(builder));

    if (nodeTypeLength > 1) {
      let type = null;

      const componentsLength = this.getVectorLength();

      if (componentsLength >= nodeTypeLength) {
        type = builder.getTypeFromLength(this.getVectorLength(), this.getComponentType(builder));
      }

      const nodeSnippet = node.build(builder, type);
      return this.components.length === nodeTypeLength && this.components === xyzw.slice(0, this.components.length)
        ? builder.format(nodeSnippet, type, output)
        : builder.format(`${nodeSnippet}.${this.components}`, this.getNodeType(builder), output);
    }

    return node.build(builder, output);
  }
}

SplitNode.prototype.isSplitNode = true;

export default SplitNode;
