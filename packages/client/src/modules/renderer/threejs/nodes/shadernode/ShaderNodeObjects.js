import { nodeObject } from './ShaderNodeObject.js';

export class ShaderNodeObjects {
  constructor(objects, altType = null) {
    for (const name in objects) {
      objects[name] = nodeObject(objects[name], altType);
    }

    return objects;
  }
}

export const nodeObjects = (val, altType = null) => new ShaderNodeObjects(val, altType);
