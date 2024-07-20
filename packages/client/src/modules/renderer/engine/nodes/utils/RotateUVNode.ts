import TempNode from '../core/TempNode.js';
import { addNodeElement, nodeProxy, vec2 } from '../shadernode/ShaderNodes.js';

class RotateUVNode extends TempNode {
  static type = 'RotateUVNode';

  constructor(uvNode, rotationNode, centerNode = vec2(0.5)) {
    super('vec2');

    this.uvNode = uvNode;
    this.rotationNode = rotationNode;
    this.centerNode = centerNode;
  }

  setup() {
    const { uvNode, rotationNode, centerNode } = this;

    const vector = uvNode.sub(centerNode);

    return vector.rotate(rotationNode).add(centerNode);
  }
}

export default RotateUVNode;

export const rotateUV = nodeProxy(RotateUVNode);

addNodeElement('rotateUV', rotateUV);
