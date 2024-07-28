import { Node } from '../core/Node.js';
import { addNodeCommand, f32, proxyNode } from '../shadernode/ShaderNodes.js';

class RemapNode extends Node {
  static type = 'RemapNode';

  constructor(node, inLowNode, inHighNode, outLowNode = f32(0), outHighNode = f32(1)) {
    super();

    this.node = node;
    this.inLowNode = inLowNode;
    this.inHighNode = inHighNode;
    this.outLowNode = outLowNode;
    this.outHighNode = outHighNode;

    this.doClamp = true;
  }

  setup() {
    const { node, inLowNode, inHighNode, outLowNode, outHighNode, doClamp } = this;

    let t = node.sub(inLowNode).div(inHighNode.sub(inLowNode));

    if (doClamp === true) t = t.clamp();

    return t.mul(outHighNode.sub(outLowNode)).add(outLowNode);
  }
}

export default RemapNode;

export const remap = proxyNode(RemapNode);
remap.doClamp = false;

export const remapClamp = proxyNode(RemapNode);

addNodeCommand('remap', remap);
addNodeCommand('remapClamp', remapClamp);
