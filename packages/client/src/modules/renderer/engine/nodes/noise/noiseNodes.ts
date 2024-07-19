import {
  cell_noise_float as cell_noise_float,
  fractal_noise_f32 as fractal_noise_f32,
  fractal_noise_vec2 as fractal_noise_vec2,
  fractal_noise_vec3 as fractal_noise_vec3,
  fractal_noise_vec4 as fractal_noise_vec4,
  perlin_noise_f32 as perlin_noise_f32,
  perlin_noise_vec3 as perlin_noise_vec3,
  worley_noise_f32 as worley_noise_f32,
  worley_noise_vec2 as worley_noise_vec2,
  worley_noise_vec3 as worley_noise_vec3,
} from './noise.js';
import { uv } from '../accessors/UVNode.js';
import { int, vec2, vec4 } from '../shadernode/ShaderNode.js';

export const node_perlin_noise_f32 = (texcoord = uv(), amplitude = 1, pivot = 0) =>
  perlin_noise_f32(texcoord.convert('vec2|vec3')).mul(amplitude).add(pivot);

export const node_noise_vec2 = (texcoord = uv(), amplitude = 1, pivot = 0) =>
  worley_noise_vec3(texcoord.convert('vec2|vec3')).mul(amplitude).add(pivot);
export const node_noise_vec3 = (texcoord = uv(), amplitude = 1, pivot = 0) =>
  worley_noise_vec3(texcoord.convert('vec2|vec3')).mul(amplitude).add(pivot);
export const node_noise_vec4 = (texcoord = uv(), amplitude = 1, pivot = 0) => {
  texcoord = texcoord.convert('vec2|vec3'); // overloading type

  const noise_vec4 = vec4(perlin_noise_vec3(texcoord), node_perlin_noise_f32(texcoord.add(vec2(19, 73))));

  return noise_vec4.mul(amplitude).add(pivot);
};

export const node_worley_noise_f32 = (texcoord = uv(), jitter = 1) =>
  worley_noise_f32(texcoord.convert('vec2|vec3'), jitter, int(1));
export const node_worley_noise_vec2 = (texcoord = uv(), jitter = 1) =>
  worley_noise_vec2(texcoord.convert('vec2|vec3'), jitter, int(1));
export const node_worley_noise_vec3 = (texcoord = uv(), jitter = 1) =>
  worley_noise_vec3(texcoord.convert('vec2|vec3'), jitter, int(1));

export const node_cell_noise_float = (texcoord = uv()) => cell_noise_float(texcoord.convert('vec2|vec3'));

export const node_fractal_noise_f32 = (position = uv(), octaves = 3, lacunarity = 2, diminish = 0.5, amplitude = 1) =>
  fractal_noise_f32(position, int(octaves), lacunarity, diminish).mul(amplitude);
export const node_fractal_noise_vec2 = (position = uv(), octaves = 3, lacunarity = 2, diminish = 0.5, amplitude = 1) =>
  fractal_noise_vec2(position, int(octaves), lacunarity, diminish).mul(amplitude);
export const node_fractal_noise_vec3 = (position = uv(), octaves = 3, lacunarity = 2, diminish = 0.5, amplitude = 1) =>
  fractal_noise_vec3(position, int(octaves), lacunarity, diminish).mul(amplitude);
export const node_fractal_noise_vec4 = (position = uv(), octaves = 3, lacunarity = 2, diminish = 0.5, amplitude = 1) =>
  fractal_noise_vec4(position, int(octaves), lacunarity, diminish).mul(amplitude);
