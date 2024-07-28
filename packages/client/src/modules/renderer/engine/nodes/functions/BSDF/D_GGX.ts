import { tslFn } from '../../shadernode/ShaderNodes.js';




const D_GGX = tslFn(({ alpha, dotNH }) => {
  const a2 = alpha.pow2();

  const denom = dotNH.pow2().mul(a2.oneMinus()).oneMinus();

  return a2.div(denom.pow2()).mul(1 / Math.PI);
}).setLayout({
  name: 'D_GGX',
  type: 'f32',
  inputs: [
    { name: 'alpha', type: 'f32' },
    { name: 'dotNH', type: 'f32' },
  ],
});

export default D_GGX;
