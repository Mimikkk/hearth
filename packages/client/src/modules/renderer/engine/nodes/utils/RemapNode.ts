import { Node } from '../core/Node.js';
import { addNodeCommand, f32, proxyNode } from '../shadernode/ShaderNodes.js';

export class RemapNode extends Node {
  doClamp: boolean;

  constructor(
    public node: Node,
    public inLowNode: Node,
    public inHighNode: Node,
    public outLowNode: Node = f32(0),
    public outHighNode: Node = f32(1),
  ) {
    super();
  }

  setup() {
    const { node, inLowNode, inHighNode, outLowNode, outHighNode, doClamp } = this;

    let t = node.sub(inLowNode).div(inHighNode.sub(inLowNode));

    if (doClamp) t = t.clamp();

    return t.mul(outHighNode.sub(outLowNode)).add(outLowNode);
  }
}

export const remap = proxyNode(
  class extends RemapNode {
    doClamp = false;
  },
);

export const remapClamp = proxyNode(
  class extends RemapNode {
    doClamp = true;
  },
);

addNodeCommand('remap', remap);
addNodeCommand('remapClamp', remapClamp);
