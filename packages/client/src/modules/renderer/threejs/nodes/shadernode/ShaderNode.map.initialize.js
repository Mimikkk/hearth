import {
  arrayBuffer,
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
  float,
  imat2,
  imat3,
  imat4,
  int,
  ivec2,
  ivec3,
  ivec4,
  mat2,
  mat3,
  mat4,
  string,
  uint,
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
import { NodeElements } from './ShaderNode.map.js';
import { NodeStack } from '@modules/renderer/threejs/nodes/shadernode/ShaderNode.stack.ts';

NodeElements.set('append', NodeStack.append);
NodeElements.set('color', color);
NodeElements.set('float', float);
NodeElements.set('int', int);
NodeElements.set('uint', uint);
NodeElements.set('bool', bool);
NodeElements.set('vec2', vec2);
NodeElements.set('ivec2', ivec2);
NodeElements.set('uvec2', uvec2);
NodeElements.set('bvec2', bvec2);
NodeElements.set('vec3', vec3);
NodeElements.set('ivec3', ivec3);
NodeElements.set('uvec3', uvec3);
NodeElements.set('bvec3', bvec3);
NodeElements.set('vec4', vec4);
NodeElements.set('ivec4', ivec4);
NodeElements.set('uvec4', uvec4);
NodeElements.set('bvec4', bvec4);
NodeElements.set('mat2', mat2);
NodeElements.set('imat2', imat2);
NodeElements.set('umat2', umat2);
NodeElements.set('bmat2', bmat2);
NodeElements.set('mat3', mat3);
NodeElements.set('imat3', imat3);
NodeElements.set('umat3', umat3);
NodeElements.set('bmat3', bmat3);
NodeElements.set('mat4', mat4);
NodeElements.set('imat4', imat4);
NodeElements.set('umat4', umat4);
NodeElements.set('bmat4', bmat4);
NodeElements.set('string', string);
NodeElements.set('arrayBuffer', arrayBuffer);
NodeElements.set('element', element);
NodeElements.set('convert', convert);
