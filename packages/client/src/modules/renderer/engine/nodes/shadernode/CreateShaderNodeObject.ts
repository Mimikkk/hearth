import { getValueType } from '@modules/renderer/engine/nodes/core/NodeUtils.js';
import { getConstNode } from '@modules/renderer/engine/nodes/shadernode/utils.js';
import { tslFn } from '@modules/renderer/engine/nodes/shadernode/tslFn.js';
import { handlers } from '@modules/renderer/engine/nodes/shadernode/ShaderNode.handlers.js';

const cache = new WeakMap();

export const createShaderNodeObject = (object, altType = null) => {
  const type = getValueType(object);

  if (type === 'node') {
    let node = cache.get(object);

    if (node === undefined) {
      node = new Proxy(object, handlers);

      cache.set(object, node);
      cache.set(node, node);
    }

    return node;
  }

  if ((altType === null && (type === 'f32' || type === 'boolean')) || (type && type !== 'shader' && type !== 'string'))
    return createShaderNodeObject(getConstNode(object, altType));

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
