import { TempNode } from '../core/TempNode.js';
import { addNodeCommand, proxyNode } from '../shadernode/ShaderNodes.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { Node } from '../core/Node.js';

export class AssignNode extends TempNode {
  constructor(
    public from: Node,
    public to: Node,
  ) {
    super();
  }

  hasDependencies() {
    return false;
  }

  getNodeType(builder: NodeBuilder, output: TypeName): TypeName {
    return output !== TypeName.void ? this.from.getNodeType(builder, output) : TypeName.void;
  }

  needsSplitAssign(builder: NodeBuilder): boolean {
    const { from } = this;

    if (builder.isAvailable('swizzleAssign') === false && from.isSplitNode && from.components.length > 1) {
      const targetLength = TypeName.size(from.node.getNodeType(builder));
      const assignDiferentVector = 'xyzw'.slice(0, targetLength) !== from.components;

      return assignDiferentVector;
    }

    return false;
  }

  generate(builder: NodeBuilder, output: TypeName): string {
    const { from, to } = this;

    const needsSplitAssign = this.needsSplitAssign(builder);

    const targetType = from.getNodeType(builder, output);

    const target = from.context({ assign: true }).build(builder);
    const source = to.build(builder, targetType);

    const sourceType = to.getNodeType(builder, output);

    const nodeData = builder.getDataFromNode(this);

    let snippet;

    if (nodeData.initialized === true) {
      if (output !== TypeName.void) {
        snippet = target;
      }
    } else if (needsSplitAssign) {
      const sourceVar = builder.getVarFromNode(this, null, targetType);
      const sourceProperty = builder.getPropertyName(sourceVar);

      builder.addLineFlowCode(`${sourceProperty} = ${source}`);

      const targetRoot = from.node.context({ assign: true }).build(builder);

      for (let i = 0; i < from.components.length; i++) {
        const component = from.components[i];

        builder.addLineFlowCode(`${targetRoot}.${component} = ${sourceProperty}[ ${i} ]`);
      }

      if (output !== TypeName.void) {
        snippet = target;
      }
    } else {
      snippet = `${target} = ${source}`;

      if (output === 'void' || sourceType === 'void') {
        builder.addLineFlowCode(snippet);

        if (output !== 'void') {
          snippet = target;
        }
      }
    }

    nodeData.initialized = true;

    return builder.format(snippet, targetType, output);
  }
}

export const assign = proxyNode(AssignNode);

Node.Map.assign = AssignNode;
