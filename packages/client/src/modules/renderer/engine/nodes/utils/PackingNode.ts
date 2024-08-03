import TempNode from '../core/TempNode.js';
import { addNodeCommand, proxyNode } from '../shadernode/ShaderNodes.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { Node } from '../core/Node.js';

export class PackingNode extends TempNode {
  scope: NodeVariant;

  constructor(public node: Node) {
    super();
  }

  getNodeType(builder: NodeBuilder): TypeName {
    return this.node.getNodeType(builder);
  }

  setup(): Node {
    switch (this.scope) {
      case NodeVariant.DirectionToColor:
        return this.node.mul(0.5).add(0.5);
      case NodeVariant.ColorToDirection:
        return this.node.mul(2.0).sub(1);
    }
  }
}

export default PackingNode;

enum NodeVariant {
  DirectionToColor = 'directionToColor',
  ColorToDirection = 'colorToDirection',
}

export const directionToColor = proxyNode(
  class extends PackingNode {
    scope = NodeVariant.DirectionToColor;
  },
);
export const colorToDirection = proxyNode(
  class extends PackingNode {
    scope = NodeVariant.ColorToDirection;
  },
);

addNodeCommand('directionToColor', directionToColor);
addNodeCommand('colorToDirection', colorToDirection);
