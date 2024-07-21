import Node from '../core/Node.ts';
import { property } from '../core/PropertyNode.js';
import { context as contextNode } from '../core/ContextNode.js';
import { addNodeElement, nodeProxy } from '../shadernode/ShaderNodes.js';

class CondNode extends Node {
  static type = 'CondNode';

  constructor(condNode, ifNode, elseNode = null) {
    super();

    this.condNode = condNode;

    this.ifNode = ifNode;
    this.elseNode = elseNode;
  }

  getNodeType(builder) {
    const ifType = this.ifNode.getNodeType(builder);

    if (this.elseNode !== null) {
      const elseType = this.elseNode.getNodeType(builder);

      if (builder.getTypeLength(elseType) > builder.getTypeLength(ifType)) {
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

    const { ifNode, elseNode } = this;

    const needsOutput = output !== 'void';
    const nodeProperty = needsOutput ? property(type).build(builder) : '';

    nodeData.nodeProperty = nodeProperty;

    const nodeSnippet = contextNode(this.condNode /*, context*/).build(builder, 'bool');

    builder.flow.code += `\nif ( ${nodeSnippet} ) {\n`;

    let ifSnippet = contextNode(ifNode, context).build(builder, type);

    if (ifSnippet) {
      if (needsOutput) {
        ifSnippet = nodeProperty + ' = ' + ifSnippet + ';';
      } else {
        ifSnippet = 'return ' + ifSnippet + ';';
      }
    }

    builder.flow.code += '\t' + ifSnippet + '\n}';

    if (elseNode !== null) {
      builder.flow.code += ' else {\n';

      let elseSnippet = contextNode(elseNode, context).build(builder, type);

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

export const cond = nodeProxy(CondNode);

addNodeElement('cond', cond);
