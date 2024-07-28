import { div } from '@modules/renderer/engine/nodes/math/OperatorNode.js';
import { EPSILON } from '@modules/renderer/engine/nodes/math/MathNode.js';
import { tslFn } from '../../shadernode/ShaderNodes.js';



const V_GGX_SmithCorrelated = tslFn(inputs => {
  const { alpha, dotNL, dotNV } = inputs;

  const a2 = alpha.pow2();

  const gv = dotNL.mul(a2.add(a2.oneMinus().mul(dotNV.pow2())).sqrt());
  const gl = dotNV.mul(a2.add(a2.oneMinus().mul(dotNL.pow2())).sqrt());

  return div(0.5, gv.add(gl).max(EPSILON));
}).setLayout({
  name: 'V_GGX_SmithCorrelated',
  type: 'f32',
  inputs: [
    { name: 'alpha', type: 'f32' },
    { name: 'dotNL', type: 'f32' },
    { name: 'dotNV', type: 'f32' },
  ],
});

export default V_GGX_SmithCorrelated;
