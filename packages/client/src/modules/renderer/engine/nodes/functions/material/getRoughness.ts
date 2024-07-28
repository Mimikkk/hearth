import getGeometryRoughness from './getGeometryRoughness.js';
import { tslFn } from '../../shadernode/ShaderNodes.js';

const getRoughness = tslFn(inputs => {
  const { roughness } = inputs;

  const geometryRoughness = getGeometryRoughness();

  let roughnessFactor = roughness.max(0.0525); 
  roughnessFactor = roughnessFactor.add(geometryRoughness);
  roughnessFactor = roughnessFactor.min(1.0);

  return roughnessFactor;
});

export default getRoughness;
