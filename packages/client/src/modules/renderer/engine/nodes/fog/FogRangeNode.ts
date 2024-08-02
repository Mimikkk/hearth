import FogNode from './FogNode.js';
import { smoothstep } from '../math/MathNode.js';
import { Node } from '../core/Node.js';
import { addNodeCommand, proxyNode } from '../shadernode/ShaderNodes.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';

export class FogRangeNode extends FogNode {
  constructor(
    colorNode: Node,
    public nearNode: Node,
    public farNode: Node,
  ) {
    super(colorNode);
  }

  setup(builder: NodeBuilder): Node {
    const viewZ = this.getViewZNode(builder);

    return smoothstep(this.nearNode, this.farNode, viewZ);
  }
}

export const rangeFog = proxyNode(FogRangeNode);

addNodeCommand('rangeFog', rangeFog);
