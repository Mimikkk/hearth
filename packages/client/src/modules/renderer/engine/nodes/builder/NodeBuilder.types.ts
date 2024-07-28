import { TypedArray } from '@modules/renderer/engine/math/MathUtils.js';
import { BufferAttribute } from '@modules/renderer/engine/core/BufferAttribute.js';

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
  // components
  f32 = 'f32',
  i32 = 'i32',
  u32 = 'u32',
  bool = 'bool',

  // alias to vec3 - to remove
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

  property = 'property',
  sampler = 'sampler',
  texture = 'texture',
  cubeTexture = 'cubeTexture',
  storageTexture = 'storageTexture',
  // special type
  void = 'void',
  // node types
  node = 'node',
  string = 'string',
  shader = 'shader',
  buffer = 'buffer',
}

export namespace TypeName {
  export const component = (type: TypeName): TypeName => {
    switch (type) {
      case TypeName.f32:
      case TypeName.i32:
      case TypeName.u32:
      case TypeName.bool:
        return type;
      case TypeName.mat2:
      case TypeName.mat3:
      case TypeName.mat4:
      case TypeName.vec2:
      case TypeName.vec3:
      case TypeName.vec4:
      case TypeName.color:
      case TypeName.texture:
      case TypeName.cubeTexture:
      case TypeName.storageTexture:
        return TypeName.f32;
      case TypeName.imat2:
      case TypeName.imat3:
      case TypeName.imat4:
      case TypeName.ivec2:
      case TypeName.ivec3:
      case TypeName.ivec4:
        return TypeName.i32;
      case TypeName.umat2:
      case TypeName.umat3:
      case TypeName.umat4:
      case TypeName.uvec2:
      case TypeName.uvec3:
      case TypeName.uvec4:
        return TypeName.u32;
      case TypeName.bmat2:
      case TypeName.bmat3:
      case TypeName.bmat4:
      case TypeName.bvec2:
      case TypeName.bvec3:
      case TypeName.bvec4:
        return TypeName.bool;
      default:
        throw new Error(`Cannot get component of non-component type: ${type}.`);
    }
  };

  export const size = (type: TypeName): number => {
    switch (type) {
      case TypeName.bool:
      case TypeName.i32:
      case TypeName.u32:
      case TypeName.f32:
        return 1;
      case TypeName.vec2:
      case TypeName.ivec2:
      case TypeName.uvec2:
      case TypeName.bvec2:
        return 2;
      case TypeName.vec3:
      case TypeName.ivec3:
      case TypeName.uvec3:
      case TypeName.bvec3:
      case TypeName.color:
        return 3;
      case TypeName.texture:
      case TypeName.cubeTexture:
      case TypeName.storageTexture:
      case TypeName.vec4:
      case TypeName.ivec4:
      case TypeName.uvec4:
      case TypeName.bvec4:
      case TypeName.mat2:
      case TypeName.imat2:
      case TypeName.umat2:
      case TypeName.bmat2:
        return 4;
      case TypeName.mat3:
      case TypeName.imat3:
      case TypeName.umat3:
      case TypeName.bmat3:
        return 9;
      case TypeName.mat4:
      case TypeName.imat4:
      case TypeName.umat4:
      case TypeName.bmat4:
        return 16;
      default:
        throw new Error(`Cannot get size of unsized type: ${type}.`);
    }
  };

  export const convertibleToVec = (type: TypeName): boolean =>
    type === TypeName.color ||
    type === TypeName.texture ||
    type === TypeName.cubeTexture ||
    type === TypeName.storageTexture;

  export const vec = (type: TypeName): TypeName => {
    switch (type) {
      case TypeName.color:
        return TypeName.vec3;
      case TypeName.texture:
      case TypeName.cubeTexture:
      case TypeName.storageTexture:
        return TypeName.vec4;
      default:
        throw new Error(`Cannot convert type to vec: ${type}.`);
    }
  };

  export const ofSize = (size: number, component: TypeName): TypeName => {
    if (size === 1) return component;

    switch (component) {
      case TypeName.f32:
        switch (size) {
          case 2:
            return TypeName.vec2;
          case 3:
            return TypeName.vec3;
          case 4:
            return TypeName.vec4;
        }
        break;
      case TypeName.i32:
        switch (size) {
          case 2:
            return TypeName.ivec2;
          case 3:
            return TypeName.ivec3;
          case 4:
            return TypeName.ivec4;
        }
        break;
      case TypeName.u32:
        switch (size) {
          case 2:
            return TypeName.uvec2;
          case 3:
            return TypeName.uvec3;
          case 4:
            return TypeName.uvec4;
        }
        break;
      case TypeName.bool:
        switch (size) {
          case 2:
            return TypeName.bvec2;
          case 3:
            return TypeName.bvec3;
          case 4:
            return TypeName.bvec4;
        }
        break;
    }
    throw new Error(`Cannot create type of size ${size} from non-component type: ${component}.`);
  };

  export const ofArray = (array: TypedArray): TypeName => {
    switch (array.constructor) {
      case Int8Array:
      case Int16Array:
      case Int32Array:
        return TypeName.i32;
      case Uint8Array:
      case Uint16Array:
      case Uint32Array:
        return TypeName.u32;
      case Float32Array:
        return TypeName.f32;
      default:
        throw new Error(`Cannot create type from array: ${array.constructor}.`);
    }
  };

  export const ofAttribute = ({ span, array }: BufferAttribute): TypeName => ofSize(span, ofArray(array));

  export const vecAsMat = (type: TypeName): TypeName => type.replace('vec', 'mat') as TypeName;

  export const matAsVec = (type: TypeName): TypeName => type.replace('mat', 'vec') as TypeName;

  export const withComponent = (type: TypeName, component: TypeName): TypeName => ofSize(size(type), component);

  export const int = (type: TypeName): TypeName => (isInt(type) ? type : withComponent(type, TypeName.i32));

  export const isComponent = (type: TypeName): boolean =>
    type === TypeName.f32 || type === TypeName.i32 || type === TypeName.u32 || type === TypeName.bool;
  export const isVec = (type: TypeName): boolean => type.includes('vec');
  export const isMat = (type: TypeName): boolean => type.includes('mat');
  export const isInt = (type: TypeName): boolean => {
    const _c = component(type);
    return _c === TypeName.i32 || _c === TypeName.u32;
  };
}
