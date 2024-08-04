import { CondNode } from '../math/CondNode.js';
import { expression } from '../code/ExpressionNode.js';
import { addNodeCommand, proxyNode } from '../shadernode/ShaderNodes.js';

export class DiscardNode extends CondNode {
  constructor(condition: Node) {
    super(condition, discarded);
  }
}

const discarded = expression('discard');
export const inlineDiscard = proxyNode(DiscardNode);
export const discard = (condition: Node) => inlineDiscard(condition).append();

addNodeCommand('discard', discard);
