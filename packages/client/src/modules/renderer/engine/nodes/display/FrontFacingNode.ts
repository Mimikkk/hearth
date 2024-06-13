import Node from '../core/Node.js';
import { float, nodeImmutable } from '../shadernode/ShaderNodes.js';

class FrontFacingNode extends Node {
  static type = 'FrontFacingNode';

  constructor() {
    super('bool');

    this.isFrontFacingNode = true;
  }

  generate(builder) {
    return builder.getFrontFacing();
  }
}

export default FrontFacingNode;

export const frontFacing = nodeImmutable(FrontFacingNode);
export const faceDirection = float(frontFacing).mul(2.0).sub(1.0);
