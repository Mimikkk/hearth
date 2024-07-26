import Node from '../core/Node.js';
import { addNodeElement, proxyNode } from '../shadernode/ShaderNodes.js';

class HashNode extends Node {
  static type = 'HashNode';

  constructor(seedNode) {
    super();

    this.seedNode = seedNode;
  }

  setup(/*builder*/) {
    // Taken from https://www.shadertoy.com/view/XlGcRh, originally from pcg-random.org

    const state = this.seedNode.u32().mul(747796405).add(2891336453);
    const word = state.shiftRight(state.shiftRight(28).add(4)).bitXor(state).mul(277803737);
    const result = word.shiftRight(22).bitXor(word);

    return result.f32().mul(1 / 2 ** 32); // Convert to range [0, 1)
  }
}

export default HashNode;

export const hash = proxyNode(HashNode);

addNodeElement('hash', hash);
