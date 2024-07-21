import { tslFn } from '../../shadernode/ShaderNodes.js';

const F_Schlick = tslFn(({ f0, f90, dotVH }) => {
  // Original approximation by Christophe Schlick '94
  // f32 fresnel = pow( 1.0 - dotVH, 5.0 );

  // Optimized variant (presented by Epic at SIGGRAPH '13)
  // https://cdn2.unrealengine.com/Resources/files/2013SiggraphPresentationsNotes-26915738.pdf
  const fresnel = dotVH.mul(-5.55473).sub(6.98316).mul(dotVH).exp2();

  return f0.mul(fresnel.oneMinus()).add(f90.mul(fresnel));
}); // validated

export default F_Schlick;
