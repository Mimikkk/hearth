import { ShaderNodeObject } from './ShaderNodeObject.js';

export const createShaderNodeObjects = (objects, altType = null) => {
  for (const name in objects) objects[name] = ShaderNodeObject(objects[name], altType);
  return objects;
};
