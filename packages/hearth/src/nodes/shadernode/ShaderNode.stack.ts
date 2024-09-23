import type { StackNode } from '../../nodes/core/StackNode.js';
import { NodeVal } from '../../nodes/core/ConstNode.js';
import { Node } from '../../nodes/core/Node.js';

let _stack: StackNode | null = null;

export const NodeStack = {
  set(stack: StackNode): void {
    _stack = stack;
  },
  get(): StackNode {
    return _stack;
  },
  if(when: NodeVal<boolean>, then: Function): StackNode {
    return _stack!.if(when, then);
  },
  append(node: Node): Node {
    _stack.push(node);
    return node;
  },
};
