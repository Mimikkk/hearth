import { tsl } from '../../shadernode/ShaderNodes.js';

export const BRDF_Lambert = tsl(inputs => inputs.diffuseColor.mul(1 / Math.PI));
