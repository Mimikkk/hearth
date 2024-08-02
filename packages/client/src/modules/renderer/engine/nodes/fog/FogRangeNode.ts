import FogNode from './FogNode.js';
import { smoothstep } from '../math/MathNode.js';
import { Node } from '../core/Node.js';
import { addNodeCommand, proxyNode } from '../shadernode/ShaderNodes.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';

export class FogRangeNode extends FogNode {
  constructor(
    color: Node,
    public near: Node,
    public far: Node,
  ) {
    super(color);
  }

  setup(builder: NodeBuilder): Node {
    return smoothstep(this.near, this.far, this.getViewZNode(builder));
  }
}

export const rangeFog = proxyNode(FogRangeNode);

addNodeCommand('rangeFog', rangeFog);
