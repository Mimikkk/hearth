import { normalGeometry } from '../../accessors/NormalNode.js';
import { tslFn } from '../../shadernode/ShaderNodes.js';

const getGeometryRoughness = tslFn(() => {
  const dxy = normalGeometry.dpdx().abs().max(normalGeometry.dpdy().abs());
  const geometryRoughness = dxy.x.max(dxy.y).max(dxy.z);

  return geometryRoughness;
});

export default getGeometryRoughness;
