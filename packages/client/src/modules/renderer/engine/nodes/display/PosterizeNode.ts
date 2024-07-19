import TempNode from '../core/TempNode.js';
import { addNodeElement, nodeProxy } from '../shadernode/ShaderNode.js';

class PosterizeNode extends TempNode {
  static type = 'PosterizeNode';

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

export default PosterizeNode;

export const posterize = nodeProxy(PosterizeNode);

addNodeElement('posterize', posterize);
