import { normalGeometry } from '../../accessors/NormalNode.js';
import { tsl } from '../../shadernode/ShaderNodes.js';

const getGeometryRoughness = tsl(() => {
  const dxy = normalGeometry.dpdx().abs().max(normalGeometry.dpdy().negate().abs());
  const geometryRoughness = dxy.x.max(dxy.y).max(dxy.z);

  return geometryRoughness;
});

export default getGeometryRoughness;
