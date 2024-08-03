import { Node } from '../core/Node.js';
import { fixedNode } from '../shadernode/ShaderNodes.js';

class PointUVNode extends Node {
  constructor() {
    super('vec2');

    this.isPointUVNode = true;
  }

  generate() {
    return 'vec2( gl_PointCoord.x, 1.0 - gl_PointCoord.y )';
  }
}

export default PointUVNode;

export const pointUV = fixedNode(PointUVNode);
