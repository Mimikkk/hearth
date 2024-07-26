import { getValueType } from '@modules/renderer/engine/nodes/core/NodeUtils.js';
import { getConstNode } from '@modules/renderer/engine/nodes/shadernode/utils.js';
import { tslFn } from '@modules/renderer/engine/nodes/shadernode/tslFn.js';
import { handlers } from '@modules/renderer/engine/nodes/shadernode/ShaderNode.handlers.js';
import { WeakMemo } from '@modules/renderer/engine/renderers/WeakMemo.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

const memo = WeakMemo.as<Node, Node>((object, memo) => {
  const node = new Proxy(object, handlers);
  memo.set(node, node);
  return node;
});

export const createShaderNodeObject = (object: Node, fallback: TypeName): Node => {
  const type = getValueType(object);

  if (type === 'node') return memo.get(object);
  if ((!fallback && (type === 'f32' || type === 'bool')) || (type && type !== 'shader' && type !== 'string'))
    return createShaderNodeObject(getConstNode(object, fallback));
  if (type === 'shader') return tslFn(object);

  return object;
};

export const createShaderNodeArray = (array, altType = null) => {
  for (let i = 0, it = array.length; i < it; ++i) array[i] = createShaderNodeObject(array[i], altType);
  return array;
};

export const createShaderNodeObjects = (objects, altType = null) => {
  for (const name in objects) objects[name] = createShaderNodeObject(objects[name], altType);
  return objects;
};
