export enum NodeUpdateType {
  NONE = 'none',
  FRAME = 'frame',
  RENDER = 'render',
  OBJECT = 'object',
}

export const buildStages = ['setup', 'analyze', 'generate'] as const;
export const shaderStages = ['fragment', 'vertex', 'compute'] as const;
export const vectorComponents = ['x', 'y', 'z', 'w'] as const;

export type NodeTypeOption =
  | 'bool'
  | 'int'
  | 'float'
  | 'vec2'
  | 'vec3'
  | 'vec4'
  | 'mat2'
  | 'mat3'
  | 'mat4'
  /* CodeNode */
  | 'code'
  /* NodeUtis.getValueType */
  | 'color'
  | 'uint'
  /* NodeBuilder.getComponentType */
  | 'int'
  | 'void'
  | 'property'
  | 'sampler'
  | 'texture'
  /* NodeBuilder.isReference */
  | 'cubeTexture'
  | 'ivec2'
  | 'uvec2'
  /* ShaderNodeBaseElements */
  | 'bvec2'
  | 'ivec3'
  | 'uvec3'
  | 'bvec3'
  | 'ivec4'
  | 'uvec4'
  | 'bvec4'
  | 'imat3'
  | 'umat3'
  | 'bmat3'
  | 'imat4'
  | 'umat4'
  | 'bmat4';

export type SwizzleCharacter = 'x' | 'y' | 'z' | 'w' | 'r' | 'g' | 'b' | 'a' | 's' | 't' | 'p' | 'q';

export type SwizzleOption = Exclude<
  | `${SwizzleCharacter}`
  | `${SwizzleCharacter}${SwizzleCharacter}`
  | `${SwizzleCharacter}${SwizzleCharacter}${SwizzleCharacter}`
  | `${SwizzleCharacter}${SwizzleCharacter}${SwizzleCharacter}${SwizzleCharacter}`,
  'abs' | 'sqrt'
>;
