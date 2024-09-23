import { FogNode } from './FogNode.js';
import { Node } from '../core/Node.js';
import { asCommand } from '../shadernode/ShaderNode.primitves.js';
import { NodeBuilder } from '../../nodes/builder/NodeBuilder.js';

export class FogExp2Node extends FogNode {
  constructor(
    color: Node,
    public density: Node,
  ) {
    super(color);
  }

  setup(builder: NodeBuilder): Node | null {
    const viewZ = this.getViewZNode(builder);
    const density = this.density;

    return density.mul(density, viewZ, viewZ).negate().exp().oneMinus();
  }
}

export const densityFog = asCommand(FogExp2Node);
