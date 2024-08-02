import { hsl } from '../../shadernode/ShaderNodes.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

export const D_GGX = hsl(
  ({ alpha, dotNH }) => {
    const a2 = alpha.pow2();

    const denom = dotNH.pow2().mul(a2.oneMinus()).oneMinus();

    return a2.div(denom.pow2()).mul(1 / Math.PI);
  },
  {
    name: 'D_GGX',
    type: TypeName.f32,
    inputs: [
      { name: 'alpha', type: TypeName.f32 },
      { name: 'dotNH', type: TypeName.f32 },
    ],
  },
);
