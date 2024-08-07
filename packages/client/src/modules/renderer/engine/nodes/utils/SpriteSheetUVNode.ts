import { Node } from '../core/Node.js';
import { uv } from '../accessors/UVNode.js';
import { f32, asCommand, vec2 } from '../shadernode/ShaderNode.primitves.ts';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

export class SpriteSheetUVNode extends Node {
  constructor(
    public countNode: Node,
    public uvNode: Node = uv(),
    public frameNode: Node = f32(0),
  ) {
    super(TypeName.vec2);
  }

  setup() {
    const { frameNode, uvNode, countNode } = this;

    const { width, height } = countNode;

    const frameNum = frameNode.mod(width.mul(height)).floor();

    const column = frameNum.mod(width);
    const row = height.sub(frameNum.add(1).div(width).ceil());

    const scale = countNode.reciprocal();
    const uvFrameOffset = vec2(column, row);

    return uvNode.add(uvFrameOffset).mul(scale);
  }
}

export const spritesheetUV = asCommand(SpriteSheetUVNode);
