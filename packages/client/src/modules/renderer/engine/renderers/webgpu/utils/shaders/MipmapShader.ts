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
    const { resources } = this.backend;

    this.samplerLinear = resources.sampler({ label: names.linear, minFilter: GPUFilterModeType.Linear });
    this.samplerNearest = resources.sampler({ label: names.nearest, minFilter: GPUFilterModeType.Nearest });
    this.shader = resources.shader({ label: names.shader, code: mipmapSource });
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
    const { samplerMap, shaderMap } = this.backend.resources;

    samplerMap.delete(names.linear);
    samplerMap.delete(names.nearest);
    shaderMap.delete(names.shader);
  }
}
