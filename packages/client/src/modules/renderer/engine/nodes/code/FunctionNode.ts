import CodeNode, { CodeNodeInclude } from './CodeNode.js';
import { nodeObject } from '../shadernode/ShaderNodes.js';
import { NodeBuilder } from '@modules/renderer/engine/renderers/webgpu/nodes/NodeBuilder.js';

import { TypeName } from '@modules/renderer/engine/renderers/webgpu/nodes/NodeBuilder.types.js';

class FunctionNode extends CodeNode {
  static type = 'FunctionNode';
  keywords: Record<string, CodeNode>;

  constructor(code: string = '', includes: CodeNodeInclude[] = []) {
    super(code, includes);

    this.keywords = {};
  }

  getNodeType(builder: NodeBuilder): TypeName {
    return this.getNodeFunction(builder).type;
  }

  getInputs(builder: NodeBuilder) {
    return this.getNodeFunction(builder).inputs;
  }

  getNodeFunction(builder: NodeBuilder) {
    const nodeData = builder.getDataFromNode(this);

    let nodeFunction = nodeData.nodeFunction;

    if (nodeFunction === undefined) {
      nodeFunction = builder.parser.parseFunction(this.code);

      nodeData.nodeFunction = nodeFunction;
    }

    return nodeFunction;
  }

  generate(builder: NodeBuilder, output?: string | 'property') {
    super.generate(builder);

    const nodeFunction = this.getNodeFunction(builder);

    const name = nodeFunction.name;
    const type = nodeFunction.type;

    const nodeCode = builder.getCodeFromNode(this, type);

    if (name !== '') {
      nodeCode.name = name;
    }

    const propertyName = builder.getPropertyName(nodeCode);

    let code = this.getNodeFunction(builder).getCode(propertyName);

    const keywords = this.keywords;
    const keywordsProperties = Object.keys(keywords);

    if (keywordsProperties.length > 0) {
      for (const property of keywordsProperties) {
        const propertyRegExp = new RegExp(`\\b${property}\\b`, 'g');
        const nodeProperty = keywords[property].build(builder, 'property');

        code = code.replace(propertyRegExp, nodeProperty);
      }
    }

    nodeCode.code = code + '\n';

    if (output === 'property') {
      return propertyName;
    } else {
      return builder.format(`${propertyName}()`, type, output);
    }
  }
}

export default FunctionNode;

const nativeFn = (code: string, includes: CodeNodeInclude[] = []) => {
  for (let i = 0; i < includes.length; i++) {
    const include = includes[i];

    // TSL Function: glslFn, wgslFn

    if (typeof include === 'function') {
      //@ts-expect-error
      includes[i] = include.functionNode;
    }
  }

  const functionNode = nodeObject(new FunctionNode(code, includes));

  const fn = (...params: any) => functionNode.call(...params);
  fn.functionNode = functionNode;

  return fn;
};

export const glslFn = (code: string, includes?: CodeNodeInclude[]) => nativeFn(code, includes);
export const wgslFn = (code: string, includes?: CodeNodeInclude[]) => nativeFn(code, includes);
