import Node from '../core/Node.js';
import { vectorComponents } from '../core/constants.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

const xyzw = 'xyzw';

type xyzw = 'x' | 'xy' | 'xyz' | 'xyzw' | 'y' | 'yz' | 'yzw' | 'z' | 'zw' | 'w';
type rgba = 'r' | 'rg' | 'rgb' | 'rgba' | 'g' | 'gb' | 'gba' | 'b' | 'ba' | 'a';
export type swizzle = xyzw | rgba;

export class SplitNode extends Node {
  declare isSplitNode: true;
  static type = 'SplitNode';

  constructor(
    public node: Node,
    public components: string,
  ) {
    super();
  }

  getVectorLength(): number {
    let vectorLength = this.components.length;

    for (const component of this.components) {
      vectorLength = Math.max(vectorComponents.indexOf(component) + 1, vectorLength);
    }

    return vectorLength;
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

    let snippet = null;

    if (nodeTypeLength > 1) {
      let type = null;

      const componentsLength = this.getVectorLength();

      if (componentsLength >= nodeTypeLength) {
        // needed expand the input node

        type = builder.getTypeFromLength(this.getVectorLength(), this.getComponentType(builder));
      }

      const nodeSnippet = node.build(builder, type);

      if (this.components.length === nodeTypeLength && this.components === xyzw.slice(0, this.components.length)) {
        // unnecessary swizzle

        snippet = builder.format(nodeSnippet, type, output);
      } else {
        snippet = builder.format(`${nodeSnippet}.${this.components}`, this.getNodeType(builder), output);
      }
    } else {
      // ignore .components if .node returns f32/integer

      snippet = node.build(builder, output);
    }

    return snippet;
  }
}

SplitNode.prototype.isSplitNode = true;

export default SplitNode;
