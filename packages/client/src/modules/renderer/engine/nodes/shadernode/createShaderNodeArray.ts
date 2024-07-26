import { ShaderNodeObject } from './ShaderNodeObject.js';

export const createShaderNodeArray = (array, altType = null) => {
  for (let i = 0, it = array.length; i < it; ++i) array[i] = ShaderNodeObject(array[i], altType);
  return array;
};
