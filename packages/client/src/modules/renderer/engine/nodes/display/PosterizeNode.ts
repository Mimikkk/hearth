import { TempNode } from '../core/TempNode.js';
import { asCommand } from '../shadernode/ShaderNode.primitves.ts';
import { implCommand } from '@modules/renderer/engine/nodes/core/Node.commands.js';

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
