import { Node } from '../core/Node.js';

export class LightingNode extends Node {
  constructor() {
    super('vec3');
  }

  generate() {
    console.warn('Abstract function.');
  }
}
