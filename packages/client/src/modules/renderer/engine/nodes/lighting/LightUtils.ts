import { hsl } from '@modules/renderer/engine/nodes/shadernode/hsl.js';

export const getDistanceAttenuation = hsl(inputs => {
  const { lightDistance, cutoffDistance, decayExponent } = inputs;

  const distanceFalloff = lightDistance.pow(decayExponent).max(0.01).reciprocal();

  return cutoffDistance
    .greaterThan(0)
    .cond(distanceFalloff.mul(lightDistance.div(cutoffDistance).pow4().oneMinus().clamp().pow2()), distanceFalloff);
});
