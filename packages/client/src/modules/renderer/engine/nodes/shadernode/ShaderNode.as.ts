import { getValueType } from '@modules/renderer/engine/nodes/core/NodeUtils.js';
import { asConstNode } from '@modules/renderer/engine/nodes/shadernode/utils.js';
import { hsl } from '@modules/renderer/engine/nodes/shadernode/hsl.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { Node } from '@modules/renderer/engine/nodes/core/Node.js';

export const asNode = <T>(value: T): Node => {
  switch (getValueType(value)) {
    case null:
    case undefined:
    case TypeName.string:
    case TypeName.node:
      return value;
    case TypeName.shader:
      return hsl(value);
    default:
      return asConstNode(value);
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
