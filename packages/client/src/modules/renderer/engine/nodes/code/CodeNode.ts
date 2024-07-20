import Node from '../core/Node.js';
import { nodeProxy } from '../shadernode/ShaderNodes.js';
import NodeBuilder from '@modules/renderer/engine/nodes/core/NodeBuilder.js';

export interface CodeNodeInclude {
  build(builder: NodeBuilder): void;
}

class CodeNode extends Node {
  static type = 'CodeNode';
  declare isCodeNode: boolean;

  constructor(
    public code: string,
    public includes: CodeNodeInclude[] = [],
  ) {
    super('code');
  }

  isGlobal() {
    return true;
  }

  setIncludes(includes: any[]) {
    this.includes = includes;

    return this;
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

export default CodeNode;

export const code = nodeProxy(CodeNode);

export const js = (src: string, includes: any[]) => code(src, includes, 'js');
export const wgsl = (src: string, includes: any[]) => code(src, includes, 'wgsl');
export const glsl = (src: string, includes: any[]) => code(src, includes, 'glsl');
