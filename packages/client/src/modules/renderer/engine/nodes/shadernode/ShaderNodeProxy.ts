import { ShaderNodeObject } from '@modules/renderer/engine/nodes/shadernode/ShaderNodeObject.js';
import { ShaderNodeArray } from '@modules/renderer/engine/nodes/shadernode/ShaderNodeArray.js';

export class ShaderNodeProxy<T extends new () => any> {
  constructor(NodeClass: T, scope = null, factor = null, settings = null) {
    const assignNode = (node: InstanceType<T>) =>
      ShaderNodeObject(settings !== null ? Object.assign(node, settings) : node);

    if (scope === null) {
      return (...params) => {
        return assignNode(new NodeClass(...new ShaderNodeArray(params)));
      };
    } else if (factor !== null) {
      factor = ShaderNodeObject(factor);

      return (...params) => {
        return assignNode(new NodeClass(scope, ...new ShaderNodeArray(params), factor));
      };
    } else {
      return (...params) => {
        return assignNode(new NodeClass(scope, ...new ShaderNodeArray(params)));
      };
    }
  }
}
