import Node, { addNodeClass } from '../core/Node.js';
import { positionView } from '../accessors/PositionNode.js';
import { addNodeElement, nodeProxy } from '../shadernode/ShaderNode.js';
import NodeBuilder from '@modules/renderer/threejs/nodes/core/NodeBuilder.js';

class FogNode extends Node {
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

addNodeClass('FogNode', FogNode);
