import FogNode from './FogNode.js';
import { smoothstep } from '../math/MathNode.js';
import Node from '../core/Node.ts';
import { addNodeElement, nodeProxy } from '../shadernode/ShaderNodes.js';
import NodeBuilder from '@modules/renderer/engine/nodes/core/NodeBuilder.js';

class FogRangeNode extends FogNode {
  static type = 'FogRangeNode';
  declare isFogRangeNode: true;

  constructor(
    colorNode: Node,
    public nearNode: Node,
    public farNode: Node,
  ) {
    super(colorNode);
    this.isFogRangeNode = true;
  }

  setup(builder: NodeBuilder): Node | null {
    const viewZ = this.getViewZNode(builder);

    return smoothstep(this.nearNode, this.farNode, viewZ);
  }
}

export default FogRangeNode;

export const rangeFog = nodeProxy(FogRangeNode);

addNodeElement('rangeFog', rangeFog);
