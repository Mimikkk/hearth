import { getValueType } from '@modules/renderer/engine/nodes/core/NodeUtils.js';
import { getConstNode } from '@modules/renderer/engine/nodes/shadernode/utils.js';
import { tslFn } from '@modules/renderer/engine/nodes/shadernode/tslFn.js';
import { handlers } from '@modules/renderer/engine/nodes/shadernode/ShaderNode.handlers.js';
import { WeakMemo } from '@modules/renderer/engine/renderers/WeakMemo.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { Node } from '@modules/renderer/engine/nodes/core/Node.js';

const memo = WeakMemo.as<Node, Node>((object, memo) => {
  const node = new Proxy(object, handlers);
  memo.set(node, node);
  return node;
});

export const asNode = (object: Node, fallback?: TypeName): Node => {
  const type = getValueType(object);

  if (type === 'node') return memo.get(object);
  if ((!fallback && (type === 'f32' || type === 'bool')) || (type && type !== 'shader' && type !== 'string'))
    return asNode(getConstNode(object, fallback));
  if (type === 'shader') return tslFn(object);

  return object;
};

export const asNodes = (array: any[], fallbackType?: TypeName): Node[] => {
  for (let i = 0, it = array.length; i < it; ++i) array[i] = asNode(array[i], fallbackType);
  return array;
};
