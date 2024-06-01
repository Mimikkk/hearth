import { nodeObject } from './ShaderNodeObject.js';
import { nodeArray } from './ShaderNodeArray.js';

export class ShaderNodeImmutable {
  constructor(NodeClass, ...params) {
    return nodeObject(new NodeClass(...nodeArray(params)));
  }
}

export const nodeImmutable = (...params) => new ShaderNodeImmutable(...params);
