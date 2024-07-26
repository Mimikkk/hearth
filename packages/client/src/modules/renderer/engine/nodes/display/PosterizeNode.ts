import TempNode from '../core/TempNode.js';
import { addNodeElement, proxyNode } from '../shadernode/ShaderNodes.js';

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

export const posterize = proxyNode(PosterizeNode);

addNodeElement('posterize', posterize);
