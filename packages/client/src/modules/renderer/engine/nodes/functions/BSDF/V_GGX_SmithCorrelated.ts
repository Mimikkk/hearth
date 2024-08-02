import { div } from '@modules/renderer/engine/nodes/math/OperatorNode.js';
import { EPSILON } from '@modules/renderer/engine/nodes/math/MathNode.js';
import { tslFn } from '../../shadernode/ShaderNodes.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

export const V_GGX_SmithCorrelated = tslFn(
  inputs => {
    const { alpha, dotNL, dotNV } = inputs;

    const a2 = alpha.pow2();

    const gv = dotNL.mul(a2.add(a2.oneMinus().mul(dotNV.pow2())).sqrt());
    const gl = dotNV.mul(a2.add(a2.oneMinus().mul(dotNL.pow2())).sqrt());

    return div(0.5, gv.add(gl).max(EPSILON));
  },
  {
    name: 'V_GGX_SmithCorrelated',
    type: TypeName.f32,
    inputs: [
      { name: 'alpha', type: TypeName.f32 },
      { name: 'dotNL', type: TypeName.f32 },
      { name: 'dotNV', type: TypeName.f32 },
    ],
  },
);
