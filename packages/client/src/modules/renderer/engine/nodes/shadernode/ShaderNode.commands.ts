import {
  bmat2,
  bmat3,
  bmat4,
  bool,
  bvec2,
  bvec3,
  bvec4,
  color,
  convert,
  element,
  f32,
  i32,
  imat2,
  imat3,
  imat4,
  ivec2,
  ivec3,
  ivec4,
  mat2,
  mat3,
  mat4,
  u32,
  umat2,
  umat3,
  umat4,
  uvec2,
  uvec3,
  uvec4,
  vec2,
  vec3,
  vec4,
} from './ShaderNode.primitves.js';
import { addNodeCommand } from './ShaderNode.map.js';
import { NodeStack } from '@modules/renderer/engine/nodes/shadernode/ShaderNode.stack.js';

addNodeCommand('append', NodeStack.append);
addNodeCommand('color', color);
addNodeCommand('f32', f32);
addNodeCommand('i32', i32);
addNodeCommand('u32', u32);
addNodeCommand('bool', bool);
addNodeCommand('vec2', vec2);
addNodeCommand('ivec2', ivec2);
addNodeCommand('uvec2', uvec2);
addNodeCommand('bvec2', bvec2);
addNodeCommand('vec3', vec3);
addNodeCommand('ivec3', ivec3);
addNodeCommand('uvec3', uvec3);
addNodeCommand('bvec3', bvec3);
addNodeCommand('vec4', vec4);
addNodeCommand('ivec4', ivec4);
addNodeCommand('uvec4', uvec4);
addNodeCommand('bvec4', bvec4);
addNodeCommand('mat2', mat2);
addNodeCommand('imat2', imat2);
addNodeCommand('umat2', umat2);
addNodeCommand('bmat2', bmat2);
addNodeCommand('mat3', mat3);
addNodeCommand('imat3', imat3);
addNodeCommand('umat3', umat3);
addNodeCommand('bmat3', bmat3);
addNodeCommand('mat4', mat4);
addNodeCommand('imat4', imat4);
addNodeCommand('umat4', umat4);
addNodeCommand('bmat4', bmat4);
addNodeCommand('element', element);
addNodeCommand('convert', convert);
