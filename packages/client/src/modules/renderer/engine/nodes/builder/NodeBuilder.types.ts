import { TypedArray } from '@modules/renderer/engine/math/MathUtils.js';
import { Attribute } from '@modules/renderer/engine/core/Attribute.js';
import { Color } from '@modules/renderer/engine/math/Color.js';
import { Vec2 } from '@modules/renderer/engine/math/Vec2.js';
import { Vec3 } from '@modules/renderer/engine/math/Vec3.js';
import { Vec4 } from '@modules/renderer/engine/math/Vec4.js';
import { Mat3 } from '@modules/renderer/engine/math/Mat3.js';
import { Mat4 } from '@modules/renderer/engine/math/Mat4.js';
import type { Node } from '@modules/renderer/engine/nodes/core/Node.js';

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

  sampler = 'sampler',
  comparison = 'sampler_comparison',
  depth1 = 'texture_depth_1d',
  depth2 = 'texture_depth_2d',
  depth3 = 'texture_depth_3d',
  depth2a = 'texture_depth_2d_array',
  depth2m = 'texture_multisampled_2d',
  depthC = 'texture_depth_cube',
  depthCa = 'texture_depth_cube_array',
  storage1 = 'texture_storage_1d',
  storage2 = 'texture_storage_2d',
  storage3 = 'texture_storage_3d',
  storage2a = 'texture_storage_2d_array',

  property = 'property',
  texture = 'texture',
  cubeTexture = 'cubeTexture',
  storageTexture = 'storageTexture',
  storageBuffer = 'storageBuffer',
  void = 'void',

  node = 'node',
  string = 'string',
  shader = 'shader',
  buffer = 'buffer',
  attribute = 'bufferAttribute',
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
      case null:
      case undefined:
      case TypeName.void:
        return 0;
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
    if (isVec(type)) return type;

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

  export const coerce = (type: TypeName): TypeName => {
    switch (type) {
      case TypeName.color:
      case TypeName.texture:
      case TypeName.cubeTexture:
      case TypeName.storageTexture:
        return vec(type);
      default:
        return type;
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

  export const ofAttribute = ({ span, array }: Attribute): TypeName => ofSize(span, ofArray(array));

  export const vecAsMat = (type: TypeName): TypeName => type.replace('vec', 'mat') as TypeName;

  export const matAsVec = (type: TypeName): TypeName => type.replace('mat', 'vec') as TypeName;

  export const withComponent = (type: TypeName, component: TypeName): TypeName => ofSize(size(type), component);

  export const int = (type: TypeName): TypeName => (isInt(type) ? type : withComponent(type, TypeName.i32));

  export const isComponent = (type: TypeName): boolean =>
    type === TypeName.f32 || type === TypeName.i32 || type === TypeName.u32 || type === TypeName.bool;
  export const isVec = (type: TypeName): boolean => type.includes('vec');
  export const isMat = (type: TypeName): boolean => type.includes('mat');
  export const isInt = (type: TypeName): boolean => {
    const c = component(type);
    return c === TypeName.i32 || c === TypeName.u32;
  };

  export const repr = (type: TypeName): string => {
    switch (type) {
      case TypeName.f32:
      case TypeName.i32:
      case TypeName.u32:
      case TypeName.bool:
        return type;
      case TypeName.vec2:
        return 'vec2<f32>';
      case TypeName.ivec2:
        return 'vec2<i32>';
      case TypeName.uvec2:
        return 'vec2<u32>';
      case TypeName.bvec2:
        return 'vec2<bool>';
      case TypeName.color:
      case TypeName.vec3:
        return 'vec3<f32>';
      case TypeName.ivec3:
        return 'vec3<i32>';
      case TypeName.uvec3:
        return 'vec3<u32>';
      case TypeName.bvec3:
        return 'vec3<bool>';
      case TypeName.vec4:
        return 'vec4<f32>';
      case TypeName.ivec4:
        return 'vec4<i32>';
      case TypeName.uvec4:
        return 'vec4<u32>';
      case TypeName.bvec4:
        return 'vec4<bool>';
      case TypeName.mat2:
        return 'mat2x2<f32>';
      case TypeName.imat2:
        return 'mat2x2<i32>';
      case TypeName.umat2:
        return 'mat2x2<u32>';
      case TypeName.bmat2:
        return 'mat2x2<bool>';
      case TypeName.mat3:
        return 'mat3x3<f32>';
      case TypeName.imat3:
        return 'mat3x3<i32>';
      case TypeName.umat3:
        return 'mat3x3<u32>';
      case TypeName.bmat3:
        return 'mat3x3<bool>';
      case TypeName.mat4:
        return 'mat4x4<f32>';
      case TypeName.imat4:
        return 'mat4x4<i32>';
      case TypeName.umat4:
        return 'mat4x4<u32>';
      case TypeName.bmat4:
        return 'mat4x4<bool>';
      case TypeName.sampler:
      case TypeName.texture:
      case TypeName.cubeTexture:
      case TypeName.storageTexture:
      // to handle
      case TypeName.void:
      case TypeName.node:
      case TypeName.string:
      case TypeName.shader:
      case TypeName.buffer:
      case TypeName.property:
        throw new Error(`Cannot represent property type ${type}.`);
    }
  };

  export function asValue(type: TypeName.color, a?: number, b?: number, c?: number, d?: number): Color;
  export function asValue(
    type: TypeName.vec2 | TypeName.uvec2 | TypeName.bvec2 | TypeName.ivec2,
    a?: number,
    b?: number,
  ): Vec2;
  export function asValue(
    type: TypeName.vec3 | TypeName.uvec3 | TypeName.bvec3 | TypeName.ivec3,
    a?: number,
    b?: number,
    c?: number,
  ): Vec3;
  export function asValue(
    type: TypeName.vec4 | TypeName.uvec4 | TypeName.bvec4 | TypeName.ivec4,
    a?: number,
    b?: number,
    c?: number,
    d?: number,
  ): Vec4;
  export function asValue(
    type: TypeName.mat3 | TypeName.imat3 | TypeName.umat3 | TypeName.bmat3,
    ...params: number[]
  ): Mat3;
  export function asValue(
    type: TypeName.mat4 | TypeName.imat4 | TypeName.umat4 | TypeName.bmat4,
    ...params: number[]
  ): Mat4;
  export function asValue(type: TypeName.bool, a?: boolean): boolean;
  export function asValue(type: TypeName.f32 | TypeName.i32 | TypeName.u32, a?: number): number;
  export function asValue(type: any, ...params: any): any;
  export function asValue(type: any, ...params: any): any {
    switch (type) {
      case TypeName.f32:
      case TypeName.i32:
      case TypeName.u32:
        return params[0] || 0;
      case TypeName.bool:
        return params[0] || false;
      case TypeName.color:
        return Color.new(...(params as [number, number, number, number]));
      case TypeName.vec2:
      case TypeName.uvec2:
      case TypeName.bvec2:
      case TypeName.ivec2:
        if (params.length === 1) return Vec2.new(params[0], params[0]);
        return Vec2.new(...params);
      case TypeName.vec3:
      case TypeName.uvec3:
      case TypeName.bvec3:
      case TypeName.ivec3:
        if (params.length === 1) return Vec3.new(params[0], params[0], params[0]);
        return Vec3.new(...params);
      case TypeName.vec4:
      case TypeName.uvec4:
      case TypeName.bvec4:
      case TypeName.ivec4:
        if (params.length === 1) return Vec4.new(params[0], params[0], params[0], params[0]);
        return Vec4.new(...params);
      case TypeName.mat3:
      case TypeName.imat3:
      case TypeName.umat3:
      case TypeName.bmat3:
        //@ts-expect-error
        return Mat3.fromColumnOrder(...params);
      case TypeName.mat4:
      case TypeName.imat4:
      case TypeName.umat4:
      case TypeName.bmat4:
        //@ts-expect-error
        return Mat4.fromColumnOrder(...params);
      default:
        throw new Error(`Unknown type: ${type}`);
    }
  }

  export function ofValue(value: undefined | null): TypeName.void;
  export function ofValue(value: Vec2): TypeName.vec2;
  export function ofValue(value: Vec3): TypeName.vec3;
  export function ofValue(value: Vec4): TypeName.vec4;
  export function ofValue(value: Mat3): TypeName.mat3;
  export function ofValue(value: Mat4): TypeName.mat4;
  export function ofValue(value: Color): TypeName.color;
  export function ofValue(value: number): TypeName.f32;
  export function ofValue(value: boolean): TypeName.bool;
  export function ofValue(value: string): TypeName.string;
  export function ofValue(value: Function): TypeName.shader;
  export function ofValue(value: Node): TypeName.node;
  export function ofValue(value: unknown): TypeName;
  export function ofValue(value: any): TypeName {
    if (value === undefined || value === null) return;

    if (value.isNode) return TypeName.node;
    const typeOf = typeof value;
    if (typeOf === 'number') return TypeName.f32;
    if (typeOf === 'string') return TypeName.string;
    if (typeOf === 'boolean') return TypeName.bool;
    if (typeOf === 'function') return TypeName.shader;
    if (Vec2.is(value)) return TypeName.vec2;
    if (Vec3.is(value)) return TypeName.vec3;
    if (Vec4.is(value)) return TypeName.vec4;
    if (Mat3.is(value)) return TypeName.mat3;
    if (Mat4.is(value)) return TypeName.mat4;
    if (Color.is(value)) return TypeName.color;

    return;
  }
}
