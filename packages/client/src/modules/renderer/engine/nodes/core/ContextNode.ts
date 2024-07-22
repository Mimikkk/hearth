import Node from './Node.js';
import { addNodeElement, nodeProxy } from '../shadernode/ShaderNodes.js';

class ContextNode extends Node {
  static type = 'ContextNode';

  constructor(node, context = {}) {
    super();

    this.isContextNode = true;

    this.node = node;
    this.context = context;
  }

  getNodeType(builder) {
    return this.node.getNodeType(builder);
  }

  setup(builder) {
    const previousContext = builder.context;

    builder.context = { ...builder.context, ...this.context };

    const node = this.node.build(builder);

    builder.context = previousContext;

    return node;
  }

  generate(builder, output) {
    const previousContext = builder.context;

    builder.context = { ...builder.context, ...this.context };

    const snippet = this.node.build(builder, output);

    builder.context = previousContext;

    return snippet;
  }
}

export default ContextNode;

export const context = nodeProxy(ContextNode);
export const label = (node, name) => context(node, { label: name });

addNodeElement('context', context);
addNodeElement('label', label);
