import Node from '../core/Node.js';
import { f32, nodeImmutable } from '../shadernode/ShaderNodes.js';

class FrontFacingNode extends Node {
  static type = 'FrontFacingNode';

  constructor() {
    super('bool');

    this.isFrontFacingNode = true;
  }

  generate(builder) {
    return builder.useFrontFacing();
  }
}

export default FrontFacingNode;

export const frontFacing = nodeImmutable(FrontFacingNode);
export const faceDirection = f32(frontFacing).mul(2.0).sub(1.0);
