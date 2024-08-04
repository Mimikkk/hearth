import { TempNode } from '../core/TempNode.js';
import { addNodeCommand, proxyNode } from '../shadernode/ShaderNodes.js';

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



export const posterize = proxyNode(PosterizeNode);

addNodeCommand('posterize', posterize);
