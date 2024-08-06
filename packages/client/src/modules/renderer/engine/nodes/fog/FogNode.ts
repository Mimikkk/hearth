import { Node } from '../core/Node.js';
import { positionView } from '../accessors/PositionNode.js';
import { asCommand } from '../shadernode/ShaderNodes.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

export class FogNode extends Node {
  constructor(
    public colorNode: Node,
    public factor?: Node,
  ) {
    super(TypeName.f32);
  }

  getViewZNode(builder: NodeBuilder) {
    const viewZ = builder.context.getViewZ?.(this) ?? positionView.z;

    return viewZ.negate();
  }

  setup(): Node | undefined {
    return this.factor;
  }
}

export const fog = asCommand(FogNode);
