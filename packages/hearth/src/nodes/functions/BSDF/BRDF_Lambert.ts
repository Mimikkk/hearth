import { hsl } from '../../shadernode/hsl.js';

export const BRDF_Lambert = hsl(inputs => inputs.diffuseColor.mul(1 / Math.PI));
