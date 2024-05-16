import Node, { addNodeClass } from '../core/Node.ts';
import { nodeProxy } from '../shadernode/ShaderNode.js';

class CodeNode extends Node {
  constructor(code = '', includes = [], language = '') {
    super('code');

    this.isCodeNode = true;

    this.code = code;
    this.language = language;

    this.includes = includes;
  }

  isGlobal() {
    return true;
  }

  setIncludes(includes) {
    this.includes = includes;

    return this;
  }

  getIncludes(/*builder*/) {
    return this.includes;
  }

  generate(builder) {
    const includes = this.getIncludes(builder);

    for (const include of includes) {
      include.build(builder);
    }

    const nodeCode = builder.getCodeFromNode(this, this.getNodeType(builder));
    nodeCode.code = this.code;

    return nodeCode.code;
  }
}

export default CodeNode;

export const code = nodeProxy(CodeNode);

export const js = (src, includes) => code(src, includes, 'js');
export const wgsl = (src, includes) => code(src, includes, 'wgsl');
export const glsl = (src, includes) => code(src, includes, 'glsl');

addNodeClass('CodeNode', CodeNode);
