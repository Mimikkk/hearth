import { getValueType } from '@modules/renderer/engine/nodes/core/NodeUtils.js';
import { asConstNode } from '@modules/renderer/engine/nodes/shadernode/utils.js';
import { hsl } from '@modules/renderer/engine/nodes/shadernode/hsl.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { Node } from '@modules/renderer/engine/nodes/core/Node.js';

export const asNode = <T>(item: T): Node => {
  const type = getValueType(item);

  if (type === TypeName.node) return item;
  if (type === TypeName.shader) return hsl(item);

  if (TypeName.isComponent(type) || (type && type !== 'string')) return asConstNode(item);

  return item;
};

export const asNodes = (array: any[], fallbackType?: TypeName): Node[] => {
  for (let i = 0, it = array.length; i < it; ++i) array[i] = asNode(array[i], fallbackType);
  return array;
};

export const proxyNode =
  <T extends new (...params: any) => any>(NodeClass: T) =>
  (...params: any[]): InstanceType<T> =>
    new NodeClass(...asNodes(params));

Node.as = asNode;
