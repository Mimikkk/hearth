import Node from '../core/Node.js';
import { positionView } from '../accessors/PositionNode.js';
import { addNodeElement, nodeProxy } from '../shadernode/ShaderNodes.js';
import NodeBuilder from '@modules/renderer/engine/nodes/core/NodeBuilder.js';

class FogNode extends Node {
  static type = 'FogNode';
  declare isFogNode: boolean;

  constructor(
    public colorNode: Node,
    public factorNode: Node | null = null,
  ) {
    super('float');

    this.isFogNode = true;
  }

  getViewZNode(builder: NodeBuilder) {
    let viewZ;

    const getViewZ = builder.context.getViewZ;

    if (getViewZ !== undefined) {
      viewZ = getViewZ(this);
    }

    return (viewZ || positionView.z).negate();
  }

  setup(): Node | null {
    return this.factorNode;
  }
}

export default FogNode;

export const fog = nodeProxy(FogNode);

addNodeElement('fog', fog);
