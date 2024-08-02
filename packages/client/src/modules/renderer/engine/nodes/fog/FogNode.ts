import { Node } from '../core/Node.js';
import { positionView } from '../accessors/PositionNode.js';
import { addNodeCommand, proxyNode } from '../shadernode/ShaderNodes.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

export class FogNode extends Node {
  static type = 'FogNode';
  declare isFogNode: boolean;

  constructor(
    public colorNode: Node,
    public factorNode: Node | null = null,
  ) {
    super(TypeName.f32);

    this.isFogNode = true;
  }

  getViewZNode(builder: NodeBuilder) {
    const viewZ = builder.context.getViewZ?.(this) ?? positionView.z;

    return viewZ.negate();
  }

  setup(): Node | null {
    return this.factorNode;
  }
}

export default FogNode;

export const fog = proxyNode(FogNode);

addNodeCommand('fog', fog);
