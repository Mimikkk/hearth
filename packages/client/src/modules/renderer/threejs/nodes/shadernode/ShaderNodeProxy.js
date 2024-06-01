import { ShaderNodeObject } from '@modules/renderer/threejs/nodes/shadernode/ShaderNodeObject.js';
import { ShaderNodeArray } from '@modules/renderer/threejs/nodes/shadernode/ShaderNodeArray.js';

export class ShaderNodeProxy {
  constructor(NodeClass, scope = null, factor = null, settings = null) {
    const assignNode = node => ShaderNodeObject(settings !== null ? Object.assign(node, settings) : node);

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
