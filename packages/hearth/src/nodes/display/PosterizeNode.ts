import { TempNode } from '../core/TempNode.js';
import { asCommand } from '../shadernode/ShaderNode.primitves.js';
import { implCommand } from '../../nodes/core/Node.commands.js';

export class PosterizeNode extends TempNode {
  constructor(sourceNode, stepsNode) {
    super();

    this.sourceNode = sourceNode;
    this.stepsNode = stepsNode;
  }

  setup() {
    const { sourceNode, stepsNode } = this;

    return sourceNode.mul(stepsNode).floor().div(stepsNode);
  }
}

export const posterize = asCommand(PosterizeNode);

implCommand('posterize', PosterizeNode);
