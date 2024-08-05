import { Node } from '../core/Node.js';
import { property } from '../core/PropertyNode.js';
import { proxyNode } from '../shadernode/ShaderNodes.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { implCommand } from '@modules/renderer/engine/nodes/core/Node.commands.js';

export class CondNode extends Node {
  constructor(
    public when: Node,
    public then: Node,
    public or?: Node,
  ) {
    super();
  }

  getNodeType(builder: NodeBuilder): TypeName {
    const typeA = this.then.getNodeType(builder);

    if (!this.or) return typeA;

    const typeB = this.or.getNodeType(builder);
    return TypeName.size(typeB) > TypeName.size(typeA) ? typeB : typeA;
  }

  generate(builder: NodeBuilder, output?: TypeName): string {
    const type = this.getNodeType(builder);
    const data = builder.getDataFromNode(this);
    if (data.nodeProperty) return data.nodeProperty;

    const { when, then, or } = this;

    const isExpression = output !== TypeName.void;
    const nodeProperty = isExpression ? property(type).build(builder) : '';

    data.nodeProperty = nodeProperty;

    const whenCode = when.build(builder, TypeName.bool);

    builder.flow.code += `\nif (${whenCode}) {\n`;

    let thenCode = then.build(builder, type);
    if (thenCode) thenCode = isExpression ? `${nodeProperty} = ${thenCode};` : `return ${thenCode};`;

    builder.flow.code += thenCode + '\n}';

    if (or) {
      builder.flow.code += ' else {\n';

      let orCode = or.build(builder, type);
      if (orCode) orCode = isExpression ? `${nodeProperty} = ${orCode};` : `return ${orCode};`;

      builder.flow.code += `${orCode}\n}\n`;
    } else {
      builder.flow.code += '\n';
    }

    return builder.format(nodeProperty, type, output);
  }
}

Node.Map.cond = CondNode;

export const cond = proxyNode(CondNode);

implCommand('cond', CondNode);
