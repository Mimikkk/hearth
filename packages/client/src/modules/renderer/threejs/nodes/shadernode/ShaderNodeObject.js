import { getValueType } from '@modules/renderer/threejs/nodes/core/NodeUtils.js';
import { getConstNode } from '@modules/renderer/threejs/nodes/shadernode/utils.js';
import { tslFn } from '@modules/renderer/threejs/nodes/shadernode/tslFn.js';
import { handlers } from '@modules/renderer/threejs/nodes/shadernode/ShaderNode.handlers.js';

const cache = new WeakMap();

export const ShaderNodeObject = function (object, altType = null) {
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

  if (
    (altType === null && (type === 'float' || type === 'boolean')) ||
    (type && type !== 'shader' && type !== 'string')
  ) {
    return ShaderNodeObject(getConstNode(object, altType));
  }

  if (type === 'shader') {
    return tslFn(object);
  }

  return object;
};
