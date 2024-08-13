import { GPUFilterModeType } from './constants.js';
import mipmapSource from './shaders/mipmap.wgsl?raw';
import { ShaderStage } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';

const names = {
  linear: 'mipmap-linear',
  nearest: 'mipmap-nearest',
  shader: 'mipmap',
};

export class HearthTexturesTexturePassMipmapShader {
  constructor(public hearth: Hearth) {}

  get samplerLinear() {
    return this.hearth.resources.samplers.get(names.linear, () => ({
      minFilter: GPUFilterModeType.Linear,
    }));
  }

  get samplerNearest() {
    return this.hearth.resources.samplers.get(names.nearest, () => ({
      minFilter: GPUFilterModeType.Nearest,
    }));
  }

  get shader() {
    return this.hearth.resources.shaders.get(names.shader, () => ({ code: mipmapSource }));
  }

  createVertexState(): GPUVertexState {
    return {
      module: this.shader,
      entryPoint: ShaderStage.Vertex,
    };
  }

  createfFragmentState(format: GPUTextureFormat, flipY: boolean): GPUFragmentState {
    return {
      module: this.shader,
      entryPoint: flipY ? 'fragment_flip_y' : 'fragment_noflip_y',
      targets: [{ format }],
    };
  }

  dispose(): void {
    const { samplers, shaders } = this.hearth.resources;

    samplers.delete(names.linear);
    samplers.delete(names.nearest);
    shaders.delete(names.shader);
  }
}
