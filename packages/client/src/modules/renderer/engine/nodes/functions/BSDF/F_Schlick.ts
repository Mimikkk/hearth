import { tslFn } from '../../shadernode/ShaderNodes.js';

const F_Schlick = tslFn(({ f0, f90, dotVH }) => {
  
  

  
  
  const fresnel = dotVH.mul(-5.55473).sub(6.98316).mul(dotVH).exp2();

  return f0.mul(fresnel.oneMinus()).add(f90.mul(fresnel));
}); 

export default F_Schlick;
