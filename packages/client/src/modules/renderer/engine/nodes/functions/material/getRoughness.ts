import getGeometryRoughness from './getGeometryRoughness.js';
import { tsl } from '../../shadernode/ShaderNodes.js';

const getRoughness = tsl(inputs => {
  const { roughness } = inputs;

  const geometryRoughness = getGeometryRoughness();

  let roughnessFactor = roughness.max(0.0525);
  roughnessFactor = roughnessFactor.add(geometryRoughness);
  roughnessFactor = roughnessFactor.min(1.0);

  return roughnessFactor;
});

export default getRoughness;
