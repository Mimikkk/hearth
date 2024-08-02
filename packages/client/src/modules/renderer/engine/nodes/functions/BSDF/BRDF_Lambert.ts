import { tslFn } from '../../shadernode/ShaderNodes.js';

export const BRDF_Lambert = tslFn(inputs => inputs.diffuseColor.mul(1 / Math.PI));
