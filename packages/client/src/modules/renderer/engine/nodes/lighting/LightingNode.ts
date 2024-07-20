import Node from '../core/Node.ts';

class LightingNode extends Node {
  static type = 'LightingNode';

  constructor() {
    super('vec3');
  }

  generate(/*builder*/) {
    console.warn('Abstract function.');
  }
}

export default LightingNode;
