import { TempNode } from '../core/TempNode.js';
import { uv, UVNode } from '../accessors/UVNode.js';
import { asCommand } from '../shadernode/ShaderNode.primitves.ts';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { implCommand } from '@modules/renderer/engine/nodes/core/Node.commands.js';
import { hsl } from '@modules/renderer/engine/nodes/shadernode/hsl.js';

const checkerShaderNode = hsl((inputs: { uv: UVNode }) => {
  const uv = inputs.uv.mul(2.0);

  const cx = uv.x.floor();
  const cy = uv.y.floor();
  const result = cx.add(cy).mod(2.0);

  return result.sign();
});

export class CheckerNode extends TempNode {
  constructor(public uvNode = uv()) {
    super(TypeName.f32);
  }

  setup() {
    return checkerShaderNode({ uv: this.uvNode });
  }
}

export const checker = asCommand(CheckerNode);

implCommand('checker', CheckerNode);
