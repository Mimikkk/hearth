import {
  createShaderNodeObject,
  createShaderNodeArray,
} from '@modules/renderer/engine/nodes/shadernode/CreateShaderNodeObject.js';

export const createShaderNodeProxy = <T extends new () => any>(NodeClass: T, scope = null, factor = null) => {
  if (scope === null) return (...params) => createShaderNodeObject(new NodeClass(...createShaderNodeArray(params)));

  if (factor !== null) {
    factor = createShaderNodeObject(factor);

    return (...params) => createShaderNodeObject(new NodeClass(scope, ...createShaderNodeArray(params), factor));
  }

  return (...params) => createShaderNodeObject(new NodeClass(scope, ...createShaderNodeArray(params)));
};
