import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

const declarationRegexp = /^[fn]*\s*([a-z_0-9]+)?\s*\(([\s\S]*?)\)\s*[\->]*\s*([a-z_0-9]+)?/i;
const propertiesRegexp = /[a-z_0-9]+|<(.*?)>+/gi;

const parseWgsl = (
  source: string,
): {
  type: TypeName;
  inputs: Argument[];
  name: string;
  inputsCode: string;
  blockCode: string;
} => {
  source = source.trim();

  const declaration = source.match(declarationRegexp);

  if (declaration?.length !== 4) {
    throw new Error('Function is not supported wgsl code.');
  }

  const inputsCode = declaration[2];
  const propsMatches = [];

  let nameMatch = null;

  while ((nameMatch = propertiesRegexp.exec(inputsCode)) !== null) {
    propsMatches.push(nameMatch);
  }

  const inputs = [];

  let i = 0;
  while (i < propsMatches.length) {
    const name = propsMatches[i++][0];
    const type = propsMatches[i++][0] as TypeName;
    if (i < propsMatches.length && propsMatches[i][0].startsWith('<')) i++;

    inputs.push({ type, name });
  }

  const blockCode = source.substring(declaration[0].length);
  const name = declaration[1] !== undefined ? declaration[1] : '';
  const type = (declaration[3] || 'void') as TypeName;

  return {
    type,
    name,
    inputs,
    inputsCode,
    blockCode,
  };
};

export class WgslFn {
  declare inputsCode: string;
  declare blockCode: string;
  type: TypeName;
  arguments: Argument[];
  name: string;

  constructor(source: string) {
    const { type, inputs, name, inputsCode, blockCode } = parseWgsl(source);

    this.inputsCode = inputsCode;
    this.blockCode = blockCode;
    this.arguments = inputs;
    this.type = type;
    this.name = name;
  }

  named(name: string): string {
    const type = this.type !== 'void' ? '-> ' + this.type : '';

    return `fn ${name}(${this.inputsCode.trim()}) ${type} ${this.blockCode}`;
  }
}

export interface Argument {
  type: TypeName;
  name: string;
}
