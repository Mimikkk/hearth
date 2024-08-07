import { Node } from '../core/Node.js';
import { asCommand } from '../shadernode/ShaderNode.primitves.ts';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

export interface CodeNodeInclude {
  build(builder: NodeBuilder): void;
}

export class CodeNode extends Node {
  declare isCodeNode: boolean;

  constructor(
    public code: string,
    public includes: CodeNodeInclude[] = [],
  ) {
    super(TypeName.void);
  }

  isGlobal(): true {
    return true;
  }

  getIncludes(builder: NodeBuilder) {
    return this.includes;
  }

  generate(builder: NodeBuilder) {
    const includes = this.getIncludes(builder);

    for (const include of includes) {
      include.build(builder);
    }

    const nodeCode = builder.getCodeFromNode(this, this.getNodeType(builder));
    nodeCode.code = this.code;

    return nodeCode.code;
  }
}

CodeNode.prototype.isCodeNode = true;

export const code = asCommand(CodeNode);
