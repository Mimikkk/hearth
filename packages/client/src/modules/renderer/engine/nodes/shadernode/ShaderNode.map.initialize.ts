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
import { NodeCommands } from './ShaderNode.map.js';
import { NodeStack } from '@modules/renderer/engine/nodes/shadernode/ShaderNode.stack.js';

NodeCommands.set('append', NodeStack.append);
NodeCommands.set('color', color);
NodeCommands.set('f32', f32);
NodeCommands.set('i32', i32);
NodeCommands.set('u32', u32);
NodeCommands.set('bool', bool);
NodeCommands.set('vec2', vec2);
NodeCommands.set('ivec2', ivec2);
NodeCommands.set('uvec2', uvec2);
NodeCommands.set('bvec2', bvec2);
NodeCommands.set('vec3', vec3);
NodeCommands.set('ivec3', ivec3);
NodeCommands.set('uvec3', uvec3);
NodeCommands.set('bvec3', bvec3);
NodeCommands.set('vec4', vec4);
NodeCommands.set('ivec4', ivec4);
NodeCommands.set('uvec4', uvec4);
NodeCommands.set('bvec4', bvec4);
NodeCommands.set('mat2', mat2);
NodeCommands.set('imat2', imat2);
NodeCommands.set('umat2', umat2);
NodeCommands.set('bmat2', bmat2);
NodeCommands.set('mat3', mat3);
NodeCommands.set('imat3', imat3);
NodeCommands.set('umat3', umat3);
NodeCommands.set('bmat3', bmat3);
NodeCommands.set('mat4', mat4);
NodeCommands.set('imat4', imat4);
NodeCommands.set('umat4', umat4);
NodeCommands.set('bmat4', bmat4);
NodeCommands.set('element', element);
NodeCommands.set('convert', convert);
