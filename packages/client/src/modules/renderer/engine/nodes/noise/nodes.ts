import {
  cell_noise_f32,
  fractal_noise_f32,
  fractal_noise_vec2,
  fractal_noise_vec3,
  fractal_noise_vec4,
  perlin_noise_f32,
  perlin_noise_vec3,
  worley_noise_f32,
  worley_noise_vec2,
  worley_noise_vec3,
  cell_noise_vec3,
} from './noise.js';
import { uv } from '../accessors/UVNode.js';
import { i32 } from '../shadernode/ShaderNodes.js';

export const Noise = {
  fractal: {
    f32: (
      position = uv(),
      octaves: number = 3,
      lacunarity: number = 2,
      diminish: number = 0.5,
      amplitude: number = 1,
    ) => fractal_noise_f32(position, i32(octaves), lacunarity, diminish).mul(amplitude),
    vec2: (position = uv(), octaves = 3, lacunarity = 2, diminish = 0.5, amplitude = 1) =>
      fractal_noise_vec2(position, i32(octaves), lacunarity, diminish).mul(amplitude),
    vec3: (position = uv(), octaves = 3, lacunarity = 2, diminish = 0.5, amplitude = 1) =>
      fractal_noise_vec3(position, i32(octaves), lacunarity, diminish).mul(amplitude),
    vec4: (position = uv(), octaves = 3, lacunarity = 2, diminish = 0.5, amplitude = 1) =>
      fractal_noise_vec4(position, i32(octaves), lacunarity, diminish).mul(amplitude),
  },
  perlin: {
    f32: (position = uv(), amplitude: number = 1, pivot: number = 0) =>
      perlin_noise_f32(position).mul(amplitude).add(pivot),
    vec3: (position = uv(), amplitude: number = 1, pivot: number = 0) =>
      perlin_noise_vec3(position).mul(amplitude).add(pivot),
  },
  worley: {
    f32: (position = uv(), jitter: number = 1) => worley_noise_f32(position, jitter, i32(1)),
    vec2: (position = uv(), jitter: number = 1) => worley_noise_vec2(position, jitter, i32(1)),
    vec3: (position = uv(), jitter: number = 1) => worley_noise_vec3(position, jitter, i32(1)),
  },
  cell: {
    f32: (position = uv()) => cell_noise_f32(position),
    vec3: (position = uv()) => cell_noise_vec3(position),
  },
};
