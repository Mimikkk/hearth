import Node from '../core/Node.ts';
import { nodeProxy } from '../shadernode/ShaderNodes.js';
import { NodeBuilder } from '@modules/renderer/engine/renderers/webgpu/nodes/NodeBuilder.js';

import { ONodeType } from '@modules/renderer/engine/nodes/core/constants.js';

class ExpressionNode extends Node {
  static type = 'ExpressionNode';

  constructor(
    public snippet: string,
    nodeType: ONodeType = 'void',
  ) {
    super(nodeType);
  }

  generate(builder: NodeBuilder, output: string | null = null) {
    const type = this.getNodeType(builder);
    const snippet = this.snippet;

    if (type === 'void') {
      builder.addLineFlowCode(snippet);
    } else {
      return builder.format(`( ${snippet} )`, type, output);
    }
  }
}

export default ExpressionNode;

export const expression = nodeProxy(ExpressionNode);
