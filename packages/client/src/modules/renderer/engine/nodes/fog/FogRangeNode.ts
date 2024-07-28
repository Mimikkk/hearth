import FogNode from './FogNode.js';
import { smoothstep } from '../math/MathNode.js';
import { Node } from '../core/Node.js';
import { addNodeCommand, proxyNode } from '../shadernode/ShaderNodes.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';

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

export const rangeFog = proxyNode(FogRangeNode);

addNodeCommand('rangeFog', rangeFog);
