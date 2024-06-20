import { mx_worley_noise_float as worley_noise_float } from './lib/mx_noise.js';
import { uv } from '../accessors/UVNode.js';
import { int } from '../shadernode/ShaderNodes.js';

export const mx_worley_noise_float = (texcoord = uv(), jitter = 1) =>
  worley_noise_float(texcoord.convert('vec2|vec3'), jitter, int(1));
