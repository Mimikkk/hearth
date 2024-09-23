import { Node } from '../core/Node.js';
import { f32 } from '../shadernode/ShaderNode.primitves.js';
import { TypeName } from '../../nodes/builder/NodeBuilder.types.js';
import { NodeBuilder } from '../../nodes/builder/NodeBuilder.js';

export class FrontFacingNode extends Node {
  constructor() {
    super(TypeName.bool);
  }

  generate(builder: NodeBuilder): string {
    return builder.useFrontFacing();
  }
}

export const frontFacing = new FrontFacingNode();
export const faceDirection = f32(frontFacing).mul(2.0).sub(1.0);
