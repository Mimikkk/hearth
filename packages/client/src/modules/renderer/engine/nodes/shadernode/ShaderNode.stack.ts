import StackNode from '@modules/renderer/engine/nodes/core/StackNode.js';

let _stack: StackNode | null = null;

export const NodeStack = {
  set(stack: StackNode) {
    _stack = stack;
  },
  get() {
    return _stack;
  },
  if(...params) {
    return _stack!.if(...params);
  },
  append(node) {
    _stack?.add(node);

    return node;
  },
};
