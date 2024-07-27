import TempNode from '../core/TempNode.js';
import { uv } from '../accessors/UVNode.js';
import { addNodeElement, proxyNode, tslFn } from '../shadernode/ShaderNodes.js';
import { UVNode } from '@modules/renderer/engine/nodes/Nodes.js';

const checkerShaderNode = tslFn(inputs => {
  const uv = inputs.uv.mul(2.0);

  const cx = uv.x.floor();
  const cy = uv.y.floor();
  const result = cx.add(cy).mod(2.0);

  return result.sign();
});

class CheckerNode extends TempNode {
  static type = 'CheckerNode';

  constructor(uvNode: UVNode = uv()) {
    super('f32');

    this.uvNode = uvNode;
  }

  setup() {
    return checkerShaderNode({ uv: this.uvNode });
  }
}

export default CheckerNode;

export const checker = proxyNode(CheckerNode);

addNodeElement('checker', checker);
