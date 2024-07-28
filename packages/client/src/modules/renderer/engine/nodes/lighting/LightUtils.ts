import { tslFn } from '../shadernode/ShaderNodes.js';

export const getDistanceAttenuation = tslFn(inputs => {
  const { lightDistance, cutoffDistance, decayExponent } = inputs;

  
  
  
  const distanceFalloff = lightDistance.pow(decayExponent).max(0.01).reciprocal();

  return cutoffDistance
    .greaterThan(0)
    .cond(distanceFalloff.mul(lightDistance.div(cutoffDistance).pow4().oneMinus().clamp().pow2()), distanceFalloff);
}); 
