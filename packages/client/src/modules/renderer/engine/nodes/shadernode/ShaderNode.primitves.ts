import { boolMap, floatMap, sintMap, uintMap } from '@modules/renderer/engine/nodes/shadernode/ShaderNode.map.js';
import { getValueFromType } from '@modules/renderer/engine/nodes/core/NodeUtils.js';
import { asConstNode } from '@modules/renderer/engine/nodes/shadernode/utils.js';
import { ConvertNode } from '@modules/renderer/engine/nodes/utils/ConvertNode.js';
import { JoinNode } from '@modules/renderer/engine/nodes/utils/JoinNode.js';
import { ArrayElementNode } from '@modules/renderer/engine/nodes/utils/ArrayElementNode.js';
import { SplitNode } from '@modules/renderer/engine/nodes/utils/SplitNode.js';
import { asNode, asNodes } from './ShaderNode.as.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { Node } from '@modules/renderer/engine/nodes/core/Node.js';
import { ConstNode } from '@modules/renderer/engine/nodes/core/ConstNode.js';

const components = [TypeName.bool, TypeName.f32, TypeName.i32, TypeName.u32];
const converted = (type: TypeName, cacheMap?: Map<number | boolean, ConstNode<number>>) => {
  const isComponent = components.includes(type);

  return (...params) => {
    if (params.length === 0 || (!isComponent && params.every(param => typeof param !== 'object'))) {
      params = [getValueFromType(type, ...params)];
    }

    let cached = cacheMap?.get(params[0]);
    if (params.length === 1 && cached) return asNode(cached);

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

export const color = converted(TypeName.color);

export const f32 = converted(TypeName.f32, floatMap);
export const i32 = converted(TypeName.i32, sintMap);
export const u32 = converted(TypeName.u32, uintMap);
export const bool = converted(TypeName.bool, boolMap);

export const vec2 = converted(TypeName.vec2);
export const ivec2 = converted(TypeName.ivec2);
export const uvec2 = converted(TypeName.uvec2);
export const bvec2 = converted(TypeName.bvec2);
export const vec3 = converted(TypeName.vec3);
export const ivec3 = converted(TypeName.ivec3);
export const uvec3 = converted(TypeName.uvec3);
export const bvec3 = converted(TypeName.bvec3);
export const vec4 = converted(TypeName.vec4);
export const ivec4 = converted(TypeName.ivec4);
export const uvec4 = converted(TypeName.uvec4);
export const bvec4 = converted(TypeName.bvec4);
export const mat2 = converted(TypeName.mat2);
export const imat2 = converted(TypeName.imat2);
export const umat2 = converted(TypeName.umat2);
export const bmat2 = converted(TypeName.bmat2);
export const mat3 = converted(TypeName.mat3);
export const imat3 = converted(TypeName.imat3);
export const umat3 = converted(TypeName.umat3);
export const bmat3 = converted(TypeName.bmat3);
export const mat4 = converted(TypeName.mat4);
export const imat4 = converted(TypeName.imat4);
export const umat4 = converted(TypeName.umat4);
export const bmat4 = converted(TypeName.bmat4);

export const proxyNode =
  <T extends new (...params: any) => any>(NodeClass: T) =>
  (...params: any[]): InstanceType<T> =>
    asNode(new NodeClass(...asNodes(params))) as InstanceType<T>;

export const fixedNode = <T extends new (...params: any) => any>(NodeClass: T, ...params: Node[]): InstanceType<T> =>
  asNode(new NodeClass(...asNodes(params))) as InstanceType<T>;

export const element = proxyNode(ArrayElementNode);
export const convert = (node, types) => asNode(new ConvertNode(asNode(node), types));
export const split = (node, channels) => asNode(new SplitNode(asNode(node), channels));

export { asNode, asNodes };
