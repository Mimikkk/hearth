import { ShaderNodeArray } from './ShaderNodeArray.js';
import { ShaderNodeObject } from './ShaderNodeObject.js';

export class ShaderNodeImmutable {
  constructor(NodeClass, ...params) {
    return ShaderNodeObject(new NodeClass(...new ShaderNodeArray(params)));
  }
}
