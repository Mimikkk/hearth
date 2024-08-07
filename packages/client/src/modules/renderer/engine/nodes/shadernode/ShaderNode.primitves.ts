import { asConst } from '@modules/renderer/engine/nodes/shadernode/utils.js';
import { ConvertNode } from '@modules/renderer/engine/nodes/utils/ConvertNode.js';
import { JoinNode } from '@modules/renderer/engine/nodes/utils/JoinNode.js';
import { ArrayElementNode } from '@modules/renderer/engine/nodes/utils/ArrayElementNode.js';
import { asCommand, asNode, asNodes } from './ShaderNode.as.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { implCommand, implPrimitive } from '@modules/renderer/engine/nodes/core/Node.commands.js';
import { ConstNode, NodeVal } from '@modules/renderer/engine/nodes/core/ConstNode.js';

const safeType = (node: ConstNode) => {
  try {
    return node.getNodeType();
  } catch {
    return null;
  }
};

const primitive = (type: TypeName) => {
  const isComponent = TypeName.isComponent(type);

  return (...params: NodeVal[]) => {
    if (params.length === 0 || (!isComponent && params.every(param => typeof param !== 'object')))
      params = [TypeName.asValue(type, ...params)];

    if (params.length === 1) {
      const node = asConst(params[0], type);

      if (safeType(node) === type) return node;
      return new ConvertNode(node, type);
    }

    const nodes = params.map(param => asConst(param));
    return new JoinNode(nodes, type);
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

export const element = asCommand(ArrayElementNode);
export const convert = asCommand(ConvertNode);

implPrimitive('color', color);
implPrimitive('f32', f32);
implPrimitive('i32', i32);
implPrimitive('u32', u32);
implPrimitive('bool', bool);
implPrimitive('vec2', vec2);
implPrimitive('ivec2', ivec2);
implPrimitive('uvec2', uvec2);
implPrimitive('bvec2', bvec2);
implPrimitive('vec3', vec3);
implPrimitive('ivec3', ivec3);
implPrimitive('uvec3', uvec3);
implPrimitive('bvec3', bvec3);
implPrimitive('vec4', vec4);
implPrimitive('ivec4', ivec4);
implPrimitive('uvec4', uvec4);
implPrimitive('bvec4', bvec4);
implPrimitive('mat2', mat2);
implPrimitive('imat2', imat2);
implPrimitive('umat2', umat2);
implPrimitive('bmat2', bmat2);
implPrimitive('mat3', mat3);
implPrimitive('imat3', imat3);
implPrimitive('umat3', umat3);
implPrimitive('bmat3', bmat3);
implPrimitive('mat4', mat4);
implPrimitive('imat4', imat4);
implPrimitive('umat4', umat4);
implPrimitive('bmat4', bmat4);
implCommand('element', ArrayElementNode);
implCommand('convert', ConvertNode);

export { asNode, asNodes, asCommand };
