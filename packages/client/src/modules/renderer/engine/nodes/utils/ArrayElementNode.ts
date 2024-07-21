import Node from '../core/Node.ts';

class ArrayElementNode extends Node {
  static type = 'ArrayElementNode';

  constructor(node, indexNode) {
    super();

    this.node = node;
    this.indexNode = indexNode;

    this.isArrayElementNode = true;
  }

  getNodeType(builder) {
    return this.node.getNodeType(builder);
  }

  generate(builder) {
    const nodeSnippet = this.node.build(builder);
    const indexSnippet = this.indexNode.build(builder, 'u32');

    return `${nodeSnippet}[ ${indexSnippet} ]`;
  }
}

export default ArrayElementNode;
