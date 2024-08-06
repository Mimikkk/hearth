import { Node } from '../core/Node.js';
import { f32, asCommand } from '../shadernode/ShaderNodes.js';
import { implCommand } from '@modules/renderer/engine/nodes/core/Node.commands.js';

export class RemapNode extends Node {
  doClamp: boolean = false;

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

export const remap = asCommand(RemapNode);

export class RemapClampNode extends RemapNode {
  doClamp = true;
}

export const remapClamp = asCommand(RemapClampNode);

implCommand('remap', RemapNode);
implCommand('remapClamp', RemapClampNode);
