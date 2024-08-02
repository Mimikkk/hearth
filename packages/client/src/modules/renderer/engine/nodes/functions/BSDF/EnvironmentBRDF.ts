import { DFGApprox } from './DFGApprox.js';
import { hsl } from '../../shadernode/ShaderNodes.js';

export const EnvironmentBRDF = hsl(inputs => {
  const { dotNV, specularColor, specularF90, roughness } = inputs;

  const fab = DFGApprox({ dotNV, roughness });
  return specularColor.mul(fab.x).add(specularF90.mul(fab.y));
});
