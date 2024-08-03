import { Node } from '../core/Node.js';
import { f32, fixedNode } from '../shadernode/ShaderNodes.js';

class FrontFacingNode extends Node {
  constructor() {
    super('bool');

    this.isFrontFacingNode = true;
  }

  generate(builder) {
    return builder.useFrontFacing();
  }
}

export default FrontFacingNode;

export const frontFacing = fixedNode(FrontFacingNode);
export const faceDirection = f32(frontFacing).mul(2.0).sub(1.0);
