import { TempNode } from '../core/TempNode.js';
import { asCommand } from '../shadernode/ShaderNodes.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { Node } from '../core/Node.js';
import { implCommand } from '@modules/renderer/engine/nodes/core/Node.commands.js';

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

enum NodeVariant {
  DirectionToColor = 'directionToColor',
  ColorToDirection = 'colorToDirection',
}

export class DirectionToColorNode extends PackingNode {
  scope = NodeVariant.DirectionToColor;
}

export class ColorToDirectionNode extends PackingNode {
  scope = NodeVariant.ColorToDirection;
}

export const directionToColor = asCommand(DirectionToColorNode);
export const colorToDirection = asCommand(ColorToDirectionNode);

implCommand('directionToColor', DirectionToColorNode);
implCommand('colorToDirection', ColorToDirectionNode);
