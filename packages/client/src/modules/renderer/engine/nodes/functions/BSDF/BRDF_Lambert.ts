import { tslFn } from '../../shadernode/ShaderNodes.js';

const BRDF_Lambert = tslFn(inputs => {
  return inputs.diffuseColor.mul(1 / Math.PI); // punctual light
}); // validated

export default BRDF_Lambert;
