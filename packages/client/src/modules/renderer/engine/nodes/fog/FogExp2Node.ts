import FogNode from './FogNode.js';
import { Node } from '../core/Node.js';
import { addNodeCommand, proxyNode } from '../shadernode/ShaderNodes.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';

class FogExp2Node extends FogNode {
  declare isFogExp2Node: true;
  static type = 'FogExp2Node';

  constructor(
    colorNode: Node,
    public densityNode: Node,
  ) {
    super(colorNode);

    this.isFogExp2Node = true;
  }

  setup(builder: NodeBuilder): Node | null {
    const viewZ = this.getViewZNode(builder);
    const density = this.densityNode;

    return density.mul(density, viewZ, viewZ).negate().exp().oneMinus();
  }
}

export default FogExp2Node;

export const densityFog = proxyNode(FogExp2Node);

addNodeCommand('densityFog', densityFog);
