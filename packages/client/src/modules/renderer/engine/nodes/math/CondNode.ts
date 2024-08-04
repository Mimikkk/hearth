import { Node } from '../core/Node.js';
import { property } from '../core/PropertyNode.js';
import { context as contextNode } from '../core/ContextNode.js';
import { addNodeCommand, proxyNode } from '../shadernode/ShaderNodes.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';

export class CondNode extends Node {
  constructor(
    public when: Node,
    public then: Node,
    public elif: Node | null = null,
  ) {
    super();
  }

  getNodeType(builder: NodeBuilder): TypeName {
    const typeA = this.then.getNodeType(builder);

    if (!this.elif) return typeA;

    const typeB = this.elif.getNodeType(builder);
    return TypeName.size(typeB) > TypeName.size(typeA) ? typeB : typeA;
  }

  generate(builder: NodeBuilder, output?: TypeName): string {
    const type = this.getNodeType(builder);
    const context = { tempWrite: false };

    const data = builder.getDataFromNode(this);
    if (data.nodeProperty) return data.nodeProperty;

    const { then, elif } = this;

    const isExpression = output !== TypeName.void;
    const nodeProperty = isExpression ? property(type).build(builder) : '';

    data.nodeProperty = nodeProperty;

    const nodeSnippet = contextNode(this.when).build(builder, TypeName.bool);

    builder.flow.code += `\nif ( ${nodeSnippet} ) {\n`;

    let ifCode = contextNode(then, context).build(builder, type);

    if (ifCode) {
      if (isExpression) {
        ifCode = nodeProperty + ' = ' + ifCode + ';';
      } else {
        ifCode = 'return ' + ifCode + ';';
      }
    }

    builder.flow.code += ifCode + '\n}';

    if (elif !== null) {
      builder.flow.code += ' else {\n';

      let elseCode = contextNode(elif, context).build(builder, type);

      if (elseCode) {
        if (isExpression) {
          elseCode = nodeProperty + ' = ' + elseCode + ';';
        } else {
          elseCode = 'return ' + elseCode + ';';
        }
      }

      builder.flow.code += elseCode + '\n}\n';
    } else {
      builder.flow.code += '\n';
    }

    return builder.format(nodeProperty, type, output);
  }
}

export default CondNode;

export const cond = proxyNode(CondNode);

addNodeCommand('cond', cond);
