import CondNode from '../math/CondNode.js';
import { expression } from '../code/ExpressionNode.js';
import { addNodeCommand, proxyNode } from '../shadernode/ShaderNodes.js';

let discardExpression;

class DiscardNode extends CondNode {
  constructor(condition) {
    discardExpression = discardExpression || expression('discard');

    super(condition, discardExpression);
  }
}

export default DiscardNode;

export const inlineDiscard = proxyNode(DiscardNode);
export const discard = condition => inlineDiscard(condition).append();

addNodeCommand('discard', discard);
