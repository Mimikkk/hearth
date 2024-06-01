import { ShaderNodeObject } from './ShaderNodeObject.js';

export class ShaderNodeArray {
  constructor(array, altType = null) {
    const len = array.length;

    for (let i = 0; i < len; i++) {
      array[i] = ShaderNodeObject(array[i], altType);
    }

    return array;
  }
}
