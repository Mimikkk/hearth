import { Backend } from '../../Backend.js';
import { GPUFilterModeType } from '../constants.js';
import mipmapSource from './mipmap.wgsl?raw';

const names = {
  linear: 'mipmap-linear',
  nearest: 'mipmap-nearest',
  shader: 'mipmap',
};

export class MipmapShader {
  samplerLinear: GPUSampler;
  samplerNearest: GPUSampler;
  shader: GPUShaderModule;

  constructor(public backend: Backend) {
    const { samplers, shaders } = this.backend.resources;

    this.samplerLinear = samplers.get(names.linear, () => ({ minFilter: GPUFilterModeType.Linear }));
    this.samplerNearest = samplers.get(names.nearest, () => ({ minFilter: GPUFilterModeType.Nearest }));
    this.shader = shaders.get(names.shader, () => ({ code: mipmapSource }));
  }

  vertexState(): GPUVertexState {
    return {
      module: this.shader,
      entryPoint: 'vertex',
    };
  }

  fragmentState(format: GPUTextureFormat, flipY: boolean): GPUFragmentState {
    return {
      module: this.shader,
      entryPoint: flipY ? 'fragment_flip_y' : 'fragment_noflip_y',
      targets: [{ format }],
    };
  }

  dispose(): void {
    const { samplers, shaders } = this.backend.resources;

    samplers.delete(names.linear);
    samplers.delete(names.nearest);
    shaders.delete(names.shader);
  }
}
