import { TempNode } from '../core/TempNode.js';
import { asCommand, vec2 } from '../shadernode/ShaderNodes.js';
import { implCommand } from '@modules/renderer/engine/nodes/core/Node.commands.js';

export class RotateUVNode extends TempNode {
  constructor(uvNode, rotationNode, centerNode = vec2(0.5)) {
    super('vec2');

    this.uvNode = uvNode;
    this.rotationNode = rotationNode;
    this.centerNode = centerNode;
  }

  setup() {
    const { uvNode, rotationNode, centerNode } = this;

    const vector = uvNode.sub(centerNode);

    return vector.rotate(rotationNode).add(centerNode);
  }
}

export const rotateUV = asCommand(RotateUVNode);

implCommand('rotateUV', RotateUVNode);
