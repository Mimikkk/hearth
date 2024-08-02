import { Node } from '../core/Node.js';
import { property } from '../core/PropertyNode.js';
import { context as contextNode } from '../core/ContextNode.js';
import { addNodeCommand, proxyNode } from '../shadernode/ShaderNodes.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

class CondNode extends Node {
  static type = 'CondNode';

  constructor(
    public when: Node,
    public valid: Node,
    public invalid: Node | null = null,
  ) {
    super();
  }

  getNodeType(builder) {
    const ifType = this.valid.getNodeType(builder);

    if (this.invalid !== null) {
      const elseType = this.invalid.getNodeType(builder);

      if (TypeName.size(elseType) > TypeName.size(ifType)) {
        return elseType;
      }
    }

    return ifType;
  }

  generate(builder, output) {
    const type = this.getNodeType(builder);
    const context = { tempWrite: false };

    const nodeData = builder.getDataFromNode(this);

    if (nodeData.nodeProperty !== undefined) {
      return nodeData.nodeProperty;
    }

    const { valid, invalid } = this;

    const needsOutput = output !== 'void';
    const nodeProperty = needsOutput ? property(type).build(builder) : '';

    nodeData.nodeProperty = nodeProperty;

    const nodeSnippet = contextNode(this.when).build(builder, 'bool');

    builder.flow.code += `\nif ( ${nodeSnippet} ) {\n`;

    let ifSnippet = contextNode(valid, context).build(builder, type);

    if (ifSnippet) {
      if (needsOutput) {
        ifSnippet = nodeProperty + ' = ' + ifSnippet + ';';
      } else {
        ifSnippet = 'return ' + ifSnippet + ';';
      }
    }

    builder.flow.code += '\t' + ifSnippet + '\n}';

    if (invalid !== null) {
      builder.flow.code += ' else {\n';

      let elseSnippet = contextNode(invalid, context).build(builder, type);

      if (elseSnippet) {
        if (needsOutput) {
          elseSnippet = nodeProperty + ' = ' + elseSnippet + ';';
        } else {
          elseSnippet = 'return ' + elseSnippet + ';';
        }
      }

      builder.flow.code += '\t' + elseSnippet + '\n' + '}\n';
    } else {
      builder.flow.code += '\n';
    }

    return builder.format(nodeProperty, type, output);
  }
}

export default CondNode;

export const cond = proxyNode(CondNode);

addNodeCommand('cond', cond);
