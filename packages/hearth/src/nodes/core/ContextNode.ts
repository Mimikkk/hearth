import { Node } from './Node.js';
import { asCommand } from '../shadernode/ShaderNode.primitves.js';
import { TypeName } from '../../nodes/builder/NodeBuilder.types.js';
import { NodeBuilder } from '../../nodes/builder/NodeBuilder.js';
import { implCommand } from '../../nodes/core/Node.commands.js';

export class ContextNode extends Node {
  constructor(
    public node: Node,
    public context: object,
  ) {
    super();
  }

  getNodeType(builder: NodeBuilder): TypeName {
    return this.node.getNodeType(builder);
  }

  setup(builder: NodeBuilder): Node {
    const context = builder.context;

    builder.context = { ...builder.context, ...this.context };

    const node = this.node.build(builder);

    builder.context = context;

    return node;
  }

  generate(builder: NodeBuilder, output?: TypeName): string {
    const context = builder.context;

    builder.context = { ...builder.context, ...this.context };

    const code = this.node.build(builder, output);

    builder.context = context;

    return code;
  }
}

export const context = asCommand(ContextNode);
export const label = (node: Node, name: string) => context(node, { label: name });

export class LabelNode extends ContextNode {
  constructor(node: Node, label: string) {
    super(node, { label });
  }
}

implCommand('context', ContextNode);
implCommand('label', LabelNode);
