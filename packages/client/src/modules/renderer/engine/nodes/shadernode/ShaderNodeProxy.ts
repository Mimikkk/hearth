import { ShaderNodeObject } from '@modules/renderer/engine/nodes/shadernode/ShaderNodeObject.js';
import { createShaderNodeArray } from '@modules/renderer/engine/nodes/shadernode/createShaderNodeArray.js';

export class ShaderNodeProxy<T extends new () => any> {
  constructor(NodeClass: T, scope = null, factor = null, settings = null) {
    const assignNode = (node: InstanceType<T>) =>
      ShaderNodeObject(settings !== null ? Object.assign(node, settings) : node);

    if (scope === null) {
      return (...params) => assignNode(new NodeClass(...createShaderNodeArray(params)));
    }

    if (factor !== null) {
      factor = ShaderNodeObject(factor);

      return (...params) => assignNode(new NodeClass(scope, ...createShaderNodeArray(params), factor));
    }

    return (...params) => assignNode(new NodeClass(scope, ...createShaderNodeArray(params)));
  }
}
