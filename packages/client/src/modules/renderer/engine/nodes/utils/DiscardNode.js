import CondNode from '../math/CondNode.js';
import { expression } from '../code/ExpressionNode.ts';
import { addNodeElement, nodeProxy } from '../shadernode/ShaderNodes.js';

let discardExpression;

class DiscardNode extends CondNode {
  static type = 'DiscardNode';

  constructor(condNode) {
    discardExpression = discardExpression || expression('discard');

    super(condNode, discardExpression);
  }
}

export default DiscardNode;

export const inlineDiscard = nodeProxy(DiscardNode);
export const discard = condNode => inlineDiscard(condNode).append();

addNodeElement('discard', discard); // @TODO: Check... this cause a little confusing using in chaining
