import { normalGeometry } from '../../accessors/NormalNode.js';
import { hsl } from '../../shadernode/ShaderNodes.js';

export const getGeometryRoughness = hsl(() => {
  const dxy = normalGeometry.dpdx().abs().max(normalGeometry.dpdy().negate().abs());
  const geometryRoughness = dxy.x.max(dxy.y).max(dxy.z);

  return geometryRoughness;
});
