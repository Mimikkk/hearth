import { Node } from './Node.js';
import { asCommand } from '../shadernode/ShaderNodes.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { implCommand } from '@modules/renderer/engine/nodes/core/Node.commands.js';

export class BypassNode extends Node {
  constructor(
    public output: Node,
    public call: Node,
  ) {
    super();
  }

  getNodeType(builder: NodeBuilder): TypeName {
    return this.output.getNodeType(builder);
  }

  generate(builder: NodeBuilder, output?: TypeName): string {
    const code = this.call.build(builder, TypeName.void);

    if (code) builder.addLineFlowCode(code);

    return this.output.build(builder);
  }
}

export const bypass = asCommand(BypassNode);

implCommand('bypass', BypassNode);
