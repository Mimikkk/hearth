import { boolMap, floatMap } from '@modules/renderer/engine/nodes/shadernode/ShaderNode.map.js';
import ConstNode from '@modules/renderer/engine/nodes/core/ConstNode.js';
import Node from '@modules/renderer/engine/nodes/core/Node.js';
import { TypeName } from '@modules/renderer/engine/renderers/nodes/NodeBuilder.types.js';

const rs = /[rs]/g;
const gt = /[gt]/g;
const bp = /[bp]/g;
const aq = /[aq]/g;

export const parseSwizzle = (props: string): string =>
  props.replace(rs, 'x').replace(gt, 'y').replace(bp, 'z').replace(aq, 'w');

type ValueByType<T> = T extends Node ? Node : T extends number ? ConstNode<number> : ConstNode<boolean>;

export const getConstNode = <T>(value: T, type: TypeName): ConstNode<ValueByType<T>> => {
  if (floatMap.has(value as number)) return floatMap.get(value as number) as unknown as ConstNode<ValueByType<T>>;
  if (boolMap.has(value as boolean)) return boolMap.get(value as boolean) as unknown as ConstNode<ValueByType<T>>;
  if (Node.is(value)) return value as unknown as ConstNode<ValueByType<T>>;
  return new ConstNode(value, type);
};
