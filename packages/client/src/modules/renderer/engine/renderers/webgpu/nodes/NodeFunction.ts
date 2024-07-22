import NodeFunctionInput from '../../../nodes/core/NodeFunctionInput.js';
import { TypeName } from '@modules/renderer/engine/renderers/webgpu/nodes/NodeBuilder.types.js';

const declarationRegexp = /^[fn]*\s*([a-z_0-9]+)?\s*\(([\s\S]*?)\)\s*[\->]*\s*([a-z_0-9]+)?/i;
const propertiesRegexp = /[a-z_0-9]+|<(.*?)>+/gi;

const parse = (
  source: string,
): {
  type: string;
  inputs: NodeFunctionInput[];
  name: string;
  inputsCode: string;
  blockCode: string;
} => {
  source = source.trim();

  const declaration = source.match(declarationRegexp);

  if (!(declaration !== null && declaration.length === 4)) {
    throw new Error('FunctionNode: Function is not a WGSL code.');
  }
  // tokenizer

  const inputsCode = declaration[2];
  const propsMatches = [];

  let nameMatch = null;

  while ((nameMatch = propertiesRegexp.exec(inputsCode)) !== null) {
    propsMatches.push(nameMatch);
  }

  // parser

  const inputs = [];

  let i = 0;

  while (i < propsMatches.length) {
    // default

    const name = propsMatches[i++][0];
    let type = propsMatches[i++][0];

    if (type === 'f32') type = 'f32';

    // precision

    if (i < propsMatches.length && propsMatches[i][0].startsWith('<')) i++;

    // add input

    inputs.push(new NodeFunctionInput(type, name));
  }

  //

  const blockCode = source.substring(declaration[0].length);

  const name = declaration[1] !== undefined ? declaration[1] : '';
  const type = declaration[3] || 'void';

  return {
    type,
    inputs,
    name,
    inputsCode,
    blockCode,
  };
};

export class NodeFunction {
  declare inputsCode: string;
  declare blockCode: string;
  type: TypeName;
  inputs: NodeFunctionInput[];
  name: string;

  constructor(source: string) {
    const { type, inputs, name, inputsCode, blockCode } = parse(source);

    this.type = type;
    this.inputs = inputs;
    this.name = name;

    this.inputsCode = inputsCode;
    this.blockCode = blockCode;
  }

  getCode(name: string) {
    const type = this.type !== 'void' ? '-> ' + this.type : '';

    return `fn ${name} ( ${this.inputsCode.trim()} ) ${type}` + this.blockCode;
  }
}

export default NodeFunction;
