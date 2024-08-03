import { Node } from '../core/Node.js';
import { addNodeCommand, proxyNode } from '../shadernode/ShaderNodes.js';

export class HashNode extends Node {
  constructor(public seed: Node) {
    super();
  }

  setup(): Node {
    const state = this.seed.u32().mul(747796405).add(2891336453);
    const word = state.shiftRight(state.shiftRight(28).add(4)).bitXor(state).mul(277803737);
    const result = word.shiftRight(22).bitXor(word);

    return result.f32().mul(1 / 2 ** 32);
  }
}

export const hash = proxyNode(HashNode);

addNodeCommand('hash', hash);
