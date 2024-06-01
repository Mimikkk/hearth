import { getValueType } from '../core/NodeUtils.js';
import { proxyHandlers, tslFn } from './ShaderNode.class.js';
import { getConstNode } from '@modules/renderer/threejs/nodes/shadernode/utils.js';

const cache = new WeakMap();

export const ShaderNodeObject = function (obj, altType = null) {
  const type = getValueType(obj);

  if (type === 'node') {
    let nodeObject = cache.get(obj);

    if (nodeObject === undefined) {
      nodeObject = new Proxy(obj, proxyHandlers);

      cache.set(obj, nodeObject);
      cache.set(nodeObject, nodeObject);
    }

    return nodeObject;
  } else if (
    (altType === null && (type === 'float' || type === 'boolean')) ||
    (type && type !== 'shader' && type !== 'string')
  ) {
    return nodeObject(getConstNode(obj, altType));
  } else if (type === 'shader') {
    return tslFn(obj);
  }

  return obj;
};
export const nodeObject = (val, altType = null) => ShaderNodeObject(val, altType);
