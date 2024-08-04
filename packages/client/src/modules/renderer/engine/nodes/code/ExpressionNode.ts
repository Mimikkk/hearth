import { Node } from '../core/Node.js';
import { proxyNode } from '../shadernode/ShaderNodes.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

export class ExpressionNode extends Node {
  constructor(
    public snippet: string,
    nodeType: TypeName = TypeName.void,
  ) {
    super(nodeType);
  }

  generate(builder: NodeBuilder, output: string | null = null): string | void {
    const type = this.getNodeType(builder);
    const snippet = this.snippet;

    if (type === TypeName.void) {
      builder.addLineFlowCode(snippet);
    } else {
      return builder.format(`(${snippet})`, type, output);
    }
  }
}

export const expression = proxyNode(ExpressionNode);
