import { Node } from '../core/Node.js';

class LightingNode extends Node {
  constructor() {
    super('vec3');
  }

  generate() {
    console.warn('Abstract function.');
  }
}

export default LightingNode;
