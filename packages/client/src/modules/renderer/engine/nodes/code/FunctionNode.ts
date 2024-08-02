import CodeNode, { CodeNodeInclude } from './CodeNode.js';
import { asNode } from '../shadernode/ShaderNodes.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';

import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { WgslFn } from '@modules/renderer/engine/nodes/builder/WgslFn.js';

export class FunctionNode extends CodeNode {
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
    return this.getNodeFunction(builder).arguments;
  }

  getNodeFunction(builder: NodeBuilder): WgslFn {
    const data = builder.getDataFromNode(this);

    let fn = data.nodeFunction;

    if (fn === undefined) {
      fn = builder.parseFn(this.code);

      data.nodeFunction = fn;
    }

    return fn;
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

    const fn = builder.getPropertyName(nodeCode);

    let code = this.getNodeFunction(builder).named(fn);

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
      return fn;
    } else {
      return builder.format(`${fn}()`, type, output);
    }
  }
}

export default FunctionNode;

const nativeFn = (code: string, includes: CodeNodeInclude[] = []) => {
  for (let i = 0; i < includes.length; i++) {
    const include = includes[i];

    if (typeof include === 'function') includes[i] = include.functionNode;
  }

  const functionNode = asNode(new FunctionNode(code, includes));

  const fn = (...params: any) => functionNode.call(...params);
  fn.functionNode = functionNode;

  return fn;
};

export const wgslFn = (code: string, includes?: CodeNodeInclude[]) => nativeFn(code, includes);
