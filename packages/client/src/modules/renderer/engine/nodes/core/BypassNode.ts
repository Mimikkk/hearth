import { Node } from './Node.js';
import { addNodeCommand, proxyNode } from '../shadernode/ShaderNodes.js';

class BypassNode extends Node {
  constructor(returnNode, callNode) {
    super();

    this.isBypassNode = true;

    this.outputNode = returnNode;
    this.callNode = callNode;
  }

  getNodeType(builder) {
    return this.outputNode.getNodeType(builder);
  }

  generate(builder) {
    const snippet = this.callNode.build(builder, 'void');

    if (snippet !== '') {
      builder.addLineFlowCode(snippet);
    }

    return this.outputNode.build(builder);
  }
}

export default BypassNode;

export const bypass = proxyNode(BypassNode);

addNodeCommand('bypass', bypass);
