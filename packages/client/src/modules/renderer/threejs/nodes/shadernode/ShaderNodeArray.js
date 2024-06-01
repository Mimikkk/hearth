import { nodeObject } from './ShaderNodeObject.js';

export class ShaderNodeArray {
  constructor(array, altType = null) {
    const len = array.length;

    for (let i = 0; i < len; i++) {
      array[i] = nodeObject(array[i], altType);
    }

    return array;
  }
}

export const nodeArray = (val, altType = null) => new ShaderNodeArray(val, altType);
