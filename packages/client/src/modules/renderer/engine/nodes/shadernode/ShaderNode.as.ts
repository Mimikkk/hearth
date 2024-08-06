import { getValueType } from '@modules/renderer/engine/nodes/core/NodeUtils.js';
import { asConstNode } from '@modules/renderer/engine/nodes/shadernode/utils.js';
import { Hsl, hsl } from '@modules/renderer/engine/nodes/shadernode/hsl.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { Node } from '@modules/renderer/engine/nodes/core/Node.js';
import { ConstNode } from '@modules/renderer/engine/nodes/core/ConstNode.js';

type Coerce<T> = T extends Node
  ? T
  : T extends null
    ? null
    : T extends undefined
      ? undefined
      : T extends string
        ? string
        : T extends (...parameters: any) => any
          ? ReturnType<Hsl<T>>
          : ConstNode<T>;

export const asNode = <T>(value: T): Coerce<T> => {
  switch (getValueType(value)) {
    case null:
    case undefined:
    case TypeName.string:
    case TypeName.node:
      return value as Coerce<T>;
    case TypeName.shader:
      return hsl(value as any) as unknown as Coerce<T>;
    default:
      return asConstNode(value) as Coerce<T>;
  }
};

export const asNodes = (array: any[]): Node[] => {
  for (let i = 0, it = array.length; i < it; ++i) array[i] = asNode(array[i]);
  return array;
};

export const asCommand =
  <T extends new (...params: any) => any>(NodeClass: T) =>
  (...params: any[]): InstanceType<T> =>
    new NodeClass(...asNodes(params));

Node.as = asNode;
