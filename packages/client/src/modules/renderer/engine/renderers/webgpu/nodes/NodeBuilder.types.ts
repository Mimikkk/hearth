export enum ShaderStage {
  Vertex = 'vertex',
  Fragment = 'fragment',
  Compute = 'compute',
}

export namespace ShaderStage {
  export const order: ShaderStage[] = [ShaderStage.Fragment, ShaderStage.Vertex, ShaderStage.Compute];
}

export enum BuildStage {
  Setup = 'setup',
  Analyze = 'analyze',
  Generate = 'generate',
}

export namespace BuildStage {
  export const order: BuildStage[] = [BuildStage.Setup, BuildStage.Analyze, BuildStage.Generate];
}

export enum BuiltinType {
  Attribute = 'attribute',
  Output = 'output',
  Vertex = 'vertex',
  Compute = 'compute',
  Fragment = 'fragment',
}

export const TypeMap = {
  f32: 'f32',
  i32: 'i32',
  u32: 'u32',
  bool: 'bool',
  color: 'vec3<f32>',
  vec2: 'vec2<f32>',
  ivec2: 'vec2<i32>',
  uvec2: 'vec2<u32>',
  bvec2: 'vec2<bool>',
  vec3: 'vec3<f32>',
  ivec3: 'vec3<i32>',
  uvec3: 'vec3<u32>',
  bvec3: 'vec3<bool>',
  vec4: 'vec4<f32>',
  ivec4: 'vec4<i32>',
  uvec4: 'vec4<u32>',
  bvec4: 'vec4<bool>',
  mat2: 'mat2x2<f32>',
  imat2: 'mat2x2<i32>',
  umat2: 'mat2x2<u32>',
  bmat2: 'mat2x2<bool>',
  mat3: 'mat3x3<f32>',
  imat3: 'mat3x3<i32>',
  umat3: 'mat3x3<u32>',
  bmat3: 'mat3x3<bool>',
  mat4: 'mat4x4<f32>',
  imat4: 'mat4x4<i32>',
  umat4: 'mat4x4<u32>',
  bmat4: 'mat4x4<bool>',
};

export enum TypeName {
  f32 = 'f32',
  i32 = 'i32',
  u32 = 'u32',
  bool = 'bool',
  color = 'color',
  vec2 = 'vec2',
  ivec2 = 'ivec2',
  uvec2 = 'uvec2',
  bvec2 = 'bvec2',
  vec3 = 'vec3',
  ivec3 = 'ivec3',
  uvec3 = 'uvec3',
  bvec3 = 'bvec3',
  vec4 = 'vec4',
  ivec4 = 'ivec4',
  uvec4 = 'uvec4',
  bvec4 = 'bvec4',
  mat2 = 'mat2',
  imat2 = 'imat2',
  umat2 = 'umat2',
  bmat2 = 'bmat2',
  mat3 = 'mat3',
  imat3 = 'imat3',
  umat3 = 'umat3',
  bmat3 = 'bmat3',
  mat4 = 'mat4',
  imat4 = 'imat4',
  umat4 = 'umat4',
  bmat4 = 'bmat4',
  void = 'void',
  int = 'int',
  property = 'property',
  sampler = 'sampler',
  texture = 'texture',
  cubeTexture = 'cubeTexture',

  node = 'node',
  string = 'string',
  shader = 'shader',
  buffer = 'buffer',
}
