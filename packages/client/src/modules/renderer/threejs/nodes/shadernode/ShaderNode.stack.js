//StackNode
let _stack = null;
export const NodeStack = {
  get() {
    return _stack;
  },

  set(stack) {
    _stack = stack;
  },

  if(...params) {
    return _stack.if(...params);
  },
  append(node) {
    return _stack.add(node);
  },
};
