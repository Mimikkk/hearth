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
    public elif?: Node,
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
    if (data.property) return data.property;

    const { then, elif } = this;
    const isExpression = output !== TypeName.void;
    const prop = isExpression ? property(type).build(builder) : '';

    data.property = prop;

    const condition = contextNode(this.when).build(builder, TypeName.bool);

    let thenCode = contextNode(then, context).build(builder, type);
    if (thenCode) thenCode = isExpression ? `${prop} = ${thenCode};` : `return ${thenCode};`;

    let ccc = `\nif (${condition}) {\n` + thenCode + '\n}';

    if (elif) {
      let elseCode = contextNode(elif, context).build(builder, type);

      elseCode = isExpression ? `${prop} = ${elseCode};` : `return ${elseCode};`;

      ccc += ` else {\n ${elseCode} \n}\n`;
    } else {
      ccc += '\n';
    }

    builder.flow.code += ccc;
    return builder.format(prop, type, output);
  }
}

export const cond = proxyNode(CondNode);

addNodeCommand('cond', cond);
