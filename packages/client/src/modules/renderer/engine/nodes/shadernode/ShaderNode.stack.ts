import type { StackNode } from '@modules/renderer/engine/nodes/core/StackNode.js';
import { NodeVal } from '@modules/renderer/engine/nodes/core/ConstNode.js';
import { Node } from '@modules/renderer/engine/nodes/core/Node.js';

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
