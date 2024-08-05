import { getValueFromType } from '@modules/renderer/engine/nodes/core/NodeUtils.js';
import { asConstNode } from '@modules/renderer/engine/nodes/shadernode/utils.js';
import { ConvertNode } from '@modules/renderer/engine/nodes/utils/ConvertNode.js';
import { JoinNode } from '@modules/renderer/engine/nodes/utils/JoinNode.js';
import { ArrayElementNode } from '@modules/renderer/engine/nodes/utils/ArrayElementNode.js';
import { asNode, asNodes, fixedNode, proxyNode } from './ShaderNode.as.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { implCommand } from '@modules/renderer/engine/nodes/core/Node.commands.js';

const primitive = (type: TypeName) => {
  const isComponent = TypeName.isComponent(type);

  return (...params) => {
    if (params.length === 0 || (!isComponent && params.every(param => typeof param !== 'object')))
      params = [getValueFromType(type, ...params)];

    if (params.length === 1) {
      const node = asConstNode(params[0], type);

      try {
        if (node.getNodeType() === type) return asNode(node);
      } catch {}

      return asNode(new ConvertNode(node, type));
    }

    const nodes = params.map(param => asConstNode(param));
    return asNode(new JoinNode(nodes, type));
  };
};

export const color = primitive(TypeName.color);
export const f32 = primitive(TypeName.f32);
export const i32 = primitive(TypeName.i32);
export const u32 = primitive(TypeName.u32);
export const bool = primitive(TypeName.bool);
export const vec2 = primitive(TypeName.vec2);
export const ivec2 = primitive(TypeName.ivec2);
export const uvec2 = primitive(TypeName.uvec2);
export const bvec2 = primitive(TypeName.bvec2);
export const vec3 = primitive(TypeName.vec3);
export const ivec3 = primitive(TypeName.ivec3);
export const uvec3 = primitive(TypeName.uvec3);
export const bvec3 = primitive(TypeName.bvec3);
export const vec4 = primitive(TypeName.vec4);
export const ivec4 = primitive(TypeName.ivec4);
export const uvec4 = primitive(TypeName.uvec4);
export const bvec4 = primitive(TypeName.bvec4);
export const mat2 = primitive(TypeName.mat2);
export const imat2 = primitive(TypeName.imat2);
export const umat2 = primitive(TypeName.umat2);
export const bmat2 = primitive(TypeName.bmat2);
export const mat3 = primitive(TypeName.mat3);
export const imat3 = primitive(TypeName.imat3);
export const umat3 = primitive(TypeName.umat3);
export const bmat3 = primitive(TypeName.bmat3);
export const mat4 = primitive(TypeName.mat4);
export const imat4 = primitive(TypeName.imat4);
export const umat4 = primitive(TypeName.umat4);
export const bmat4 = primitive(TypeName.bmat4);

export const element = proxyNode(ArrayElementNode);
export const convert = proxyNode(ConvertNode);

implCommand('color', color, true);
implCommand('f32', f32, true);
implCommand('i32', i32, true);
implCommand('u32', u32, true);
implCommand('bool', bool, true);
implCommand('vec2', vec2, true);
implCommand('ivec2', ivec2, true);
implCommand('uvec2', uvec2, true);
implCommand('bvec2', bvec2, true);
implCommand('vec3', vec3, true);
implCommand('ivec3', ivec3, true);
implCommand('uvec3', uvec3, true);
implCommand('bvec3', bvec3, true);
implCommand('vec4', vec4, true);
implCommand('ivec4', ivec4, true);
implCommand('uvec4', uvec4, true);
implCommand('bvec4', bvec4, true);
implCommand('mat2', mat2, true);
implCommand('imat2', imat2, true);
implCommand('umat2', umat2, true);
implCommand('bmat2', bmat2, true);
implCommand('mat3', mat3, true);
implCommand('imat3', imat3, true);
implCommand('umat3', umat3, true);
implCommand('bmat3', bmat3, true);
implCommand('mat4', mat4, true);
implCommand('imat4', imat4, true);
implCommand('umat4', umat4, true);
implCommand('bmat4', bmat4, true);
implCommand('element', ArrayElementNode);
implCommand('convert', ConvertNode);

export { asNode, asNodes, proxyNode, fixedNode };
