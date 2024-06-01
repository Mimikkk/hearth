import { nodeObject } from './ShaderNodeObject.js';
import { nodeArray } from './ShaderNodeArray.js';

export class ShaderNodeProxy {
  constructor(NodeClass, scope = null, factor = null, settings = null) {
    const assignNode = node => nodeObject(settings !== null ? Object.assign(node, settings) : node);

    if (scope === null) return (...params) => assignNode(new NodeClass(...nodeArray(params)));
    if (factor !== null) {
      factor = nodeObject(factor);

      return (...params) => assignNode(new NodeClass(scope, ...nodeArray(params), factor));
    }
    return (...params) => assignNode(new NodeClass(scope, ...nodeArray(params)));
  }
}

export const nodeProxy = (...params) => new ShaderNodeProxy(...params);
