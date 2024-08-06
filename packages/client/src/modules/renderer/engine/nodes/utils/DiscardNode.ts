import { CondNode } from '../math/CondNode.js';
import { expression } from '../code/ExpressionNode.js';
import { asCommand } from '../shadernode/ShaderNodes.js';
import { implCommand } from '@modules/renderer/engine/nodes/core/Node.commands.js';

export class DiscardNode extends CondNode {
  constructor(condition: Node) {
    super(condition, discarded);
  }
}

const discarded = expression('discard');
export const inlineDiscard = asCommand(DiscardNode);

export const discard = (condition: Node) => inlineDiscard(condition).append();

export class InlineDiscardNode extends DiscardNode {
  constructor(condition: Node) {
    super(condition);
    this.append();
  }
}

implCommand('discard', InlineDiscardNode);
