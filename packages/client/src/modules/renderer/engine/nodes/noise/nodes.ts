import {
  cellF32,
  cellVec3,
  fractalF32,
  fractalVec2,
  fractalVec3,
  fractalVec4,
  perlinF32,
  perlinVec3,
  triF32,
  worleyF32,
  worleyVec2,
  worleyVec3,
} from './noise.js';
import { uv } from '../accessors/UVNode.js';
import { i32 } from '../shadernode/ShaderNode.primitves.ts';

export const Noise = {
  fractal: {
    f32: (
      position = uv(),
      octaves: number = 3,
      lacunarity: number = 2,
      diminish: number = 0.5,
      amplitude: number = 1,
    ) => fractalF32(position, i32(octaves), lacunarity, diminish).mul(amplitude),
    vec2: (position = uv(), octaves = 3, lacunarity = 2, diminish = 0.5, amplitude = 1) =>
      fractalVec2(position, i32(octaves), lacunarity, diminish).mul(amplitude),
    vec3: (position = uv(), octaves = 3, lacunarity = 2, diminish = 0.5, amplitude = 1) =>
      fractalVec3(position, i32(octaves), lacunarity, diminish).mul(amplitude),
    vec4: (position = uv(), octaves = 3, lacunarity = 2, diminish = 0.5, amplitude = 1) =>
      fractalVec4(position, i32(octaves), lacunarity, diminish).mul(amplitude),
  },
  perlin: {
    f32: (position = uv(), amplitude: number = 1, pivot: number = 0) => perlinF32(position).mul(amplitude).add(pivot),
    vec3: (position = uv(), amplitude: number = 1, pivot: number = 0) => perlinVec3(position).mul(amplitude).add(pivot),
  },
  worley: {
    f32: (position = uv(), jitter: number = 1) => worleyF32(position, jitter, i32(1)),
    vec2: (position = uv(), jitter: number = 1) => worleyVec2(position, jitter, i32(1)),
    vec3: (position = uv(), jitter: number = 1) => worleyVec3(position, jitter, i32(1)),
  },
  cell: {
    f32: (position = uv()) => cellF32(position),
    vec3: (position = uv()) => cellVec3(position),
  },
  tri: {
    f32: triF32,
  },
};
