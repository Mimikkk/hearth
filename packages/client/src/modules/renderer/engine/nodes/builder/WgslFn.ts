import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

const declarationRegexp = /^[fn]*\s*([a-z_0-9]+)?\s*\(([\s\S]*?)\)\s*[\->]*\s*([a-z_0-9]+)?/i;
const propertiesRegexp = /[a-z_0-9]+|<(.*?)>+/gi;

const coerceType = (type: string): TypeName => {
  switch (type) {
    case 'vec2f':
      return TypeName.vec2;
    case 'vec3f':
      return TypeName.vec3;
    case 'vec4f':
      return TypeName.vec4;
    case 'mat2x2f':
      return TypeName.mat2;
    case 'mat3x3f':
      return TypeName.mat3;
    case 'mat4x4f':
      return TypeName.mat4;
    case 'vec2b':
      return TypeName.bvec2;
    case 'vec3b':
      return TypeName.bvec3;
    case 'vec4b':
      return TypeName.bvec4;
    case 'mat2x2b':
      return TypeName.bmat2;
    case 'mat3x3b':
      return TypeName.bmat3;
    case 'mat4x4b':
      return TypeName.bmat4;
    case 'vec2i':
      return TypeName.ivec2;
    case 'vec3i':
      return TypeName.ivec3;
    case 'vec4i':
      return TypeName.ivec4;
    case 'mat2x2i':
      return TypeName.imat2;
    case 'mat3x3i':
      return TypeName.imat3;
    case 'mat4x4i':
      return TypeName.imat4;
    case 'vec2u':
      return TypeName.uvec2;
    case 'vec3u':
      return TypeName.uvec3;
    case 'vec4u':
      return TypeName.uvec4;
    case 'mat2x2u':
      return TypeName.umat2;
    case 'mat3x3u':
      return TypeName.umat3;
    case 'mat4x4u':
      return TypeName.umat4;
    default:
      return type as TypeName;
  }
};

const parseWgsl = (
  source: string,
): {
  type: TypeName;
  inputs: WgslArgument[];
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

    inputs.push({ type: coerceType(type), name });
  }

  const blockCode = source.substring(declaration[0].length);
  const name = declaration[1] !== undefined ? declaration[1] : '';
  const type = declaration[3] ? coerceType(declaration[3]) : TypeName.void;

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
  arguments: WgslArgument[];
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

export interface WgslArgument {
  type: TypeName;
  name: string;
}
