import { TempNode } from '../core/TempNode.js';
import { positionWorldDirection } from '../accessors/PositionNode.js';
import { asCommand, vec2 } from '../shadernode/ShaderNodes.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

export class EquirectUVNode extends TempNode {
  constructor(public dirNode = positionWorldDirection) {
    super(TypeName.vec2);
  }

  setup() {
    const dir = this.dirNode;

    const u = dir.z
      .atan2(dir.x)
      .mul(1 / (Math.PI * 2))
      .add(0.5);

    const v = dir.y
      .clamp(-1.0, 1.0)
      .asin()
      .mul(1 / Math.PI)
      .add(0.5);

    return vec2(u, v);
  }
}

export const equirectUV = asCommand(EquirectUVNode);
