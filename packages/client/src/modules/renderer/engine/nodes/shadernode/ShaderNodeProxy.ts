import { createShaderNodeArray, asNode } from '@modules/renderer/engine/nodes/shadernode/asNode.js';

export class ShaderNodeProxy<T extends new () => any> {
  constructor(NodeClass: T, scope = null, factor = null, settings = null) {
    const assignNode = (node: InstanceType<T>) => asNode(settings !== null ? Object.assign(node, settings) : node);

    if (scope === null) {
      return (...params) => assignNode(new NodeClass(...createShaderNodeArray(params)));
    }

    if (factor !== null) {
      factor = asNode(factor);

      return (...params) => assignNode(new NodeClass(scope, ...createShaderNodeArray(params), factor));
    }

    return (...params) => assignNode(new NodeClass(scope, ...createShaderNodeArray(params)));
  }
}
