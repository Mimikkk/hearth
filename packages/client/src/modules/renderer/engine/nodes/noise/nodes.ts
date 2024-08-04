import {
  cell_noise_float,
  fractal_noise_float,
  fractal_noise_vec2,
  fractal_noise_vec3,
  fractal_noise_vec4,
  perlin_noise_float,
  perlin_noise_vec3,
  worley_noise_float,
  worley_noise_vec2,
  worley_noise_vec3,
} from './noise.js';
import { uv } from '../accessors/UVNode.js';
import { i32, vec2, vec4 } from '../shadernode/ShaderNodes.js';

export const mx_perlin_noise_float = (texcoord = uv(), amplitude = 1, pivot = 0) =>
  perlin_noise_float(texcoord.convert('vec2|vec3')).mul(amplitude).add(pivot);
export const mx_noise_vec2 = (texcoord = uv(), amplitude = 1, pivot = 0) =>
  worley_noise_vec3(texcoord.convert('vec2|vec3')).mul(amplitude).add(pivot);
export const mx_noise_vec3 = (texcoord = uv(), amplitude = 1, pivot = 0) =>
  worley_noise_vec3(texcoord.convert('vec2|vec3')).mul(amplitude).add(pivot);
export const mx_noise_vec4 = (texcoord = uv(), amplitude = 1, pivot = 0) => {
  texcoord = texcoord.convert('vec2|vec3');

  const noise_vec4 = vec4(perlin_noise_vec3(texcoord), mx_perlin_noise_float(texcoord.add(vec2(19, 73))));

  return noise_vec4.mul(amplitude).add(pivot);
};

export const mx_worley_noise_float = (texcoord = uv(), jitter = 1) =>
  worley_noise_float(texcoord.convert('vec2|vec3'), jitter, i32(1));
export const mx_worley_noise_vec2 = (texcoord = uv(), jitter = 1) =>
  worley_noise_vec2(texcoord.convert('vec2|vec3'), jitter, i32(1));
export const mx_worley_noise_vec3 = (texcoord = uv(), jitter = 1) =>
  worley_noise_vec3(texcoord.convert('vec2|vec3'), jitter, i32(1));

export const mx_cell_noise_float = (texcoord = uv()) => cell_noise_float(texcoord.convert('vec2|vec3'));

export const mx_fractal_noise_float = (position = uv(), octaves = 3, lacunarity = 2, diminish = 0.5, amplitude = 1) =>
  fractal_noise_float(position, i32(octaves), lacunarity, diminish).mul(amplitude);
export const mx_fractal_noise_vec2 = (position = uv(), octaves = 3, lacunarity = 2, diminish = 0.5, amplitude = 1) =>
  fractal_noise_vec2(position, i32(octaves), lacunarity, diminish).mul(amplitude);
export const mx_fractal_noise_vec3 = (position = uv(), octaves = 3, lacunarity = 2, diminish = 0.5, amplitude = 1) =>
  fractal_noise_vec3(position, i32(octaves), lacunarity, diminish).mul(amplitude);
export const mx_fractal_noise_vec4 = (position = uv(), octaves = 3, lacunarity = 2, diminish = 0.5, amplitude = 1) =>
  fractal_noise_vec4(position, i32(octaves), lacunarity, diminish).mul(amplitude);
