import Node from '../core/Node.ts';
import { uv } from '../accessors/UVNode.js';
import { f32, nodeProxy, vec2 } from '../shadernode/ShaderNodes.js';

class SpriteSheetUVNode extends Node {
  static type = 'SpriteSheetUVNode';

  constructor(countNode, uvNode = uv(), frameNode = f32(0)) {
    super('vec2');

    this.countNode = countNode;
    this.uvNode = uvNode;
    this.frameNode = frameNode;
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

export default SpriteSheetUVNode;

export const spritesheetUV = nodeProxy(SpriteSheetUVNode);
