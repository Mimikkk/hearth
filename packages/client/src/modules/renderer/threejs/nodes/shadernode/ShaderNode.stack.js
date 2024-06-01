let _stack = null;

export const NodeStack = {
  set(stack) {
    _stack = stack;
  },
  get() {
    return _stack;
  },
  if(...params) {
    return _stack.if(...params);
  },
  append(node) {
    if (_stack) _stack.add(node);

    return node;
  },
};
