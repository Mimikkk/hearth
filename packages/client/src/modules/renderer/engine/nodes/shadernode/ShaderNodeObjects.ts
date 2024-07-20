import { ShaderNodeObject } from './ShaderNodeObject.js';

export class ShaderNodeObjects {
  constructor(objects, altType = null) {
    for (const name in objects) {
      objects[name] = ShaderNodeObject(objects[name], altType);
    }

    return objects;
  }
}
