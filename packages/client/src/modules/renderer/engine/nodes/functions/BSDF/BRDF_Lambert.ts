import { hsl } from '../../shadernode/hsl.ts';

export const BRDF_Lambert = hsl(inputs => inputs.diffuseColor.mul(1 / Math.PI));
