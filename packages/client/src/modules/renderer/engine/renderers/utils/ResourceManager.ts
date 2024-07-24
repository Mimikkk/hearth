import { Backend } from '@modules/renderer/engine/renderers/Backend.js';
import { ResourceMap } from '@modules/renderer/engine/renderers/utils/ResourceMap.js';

export class ResourceManager {
  shaders: ResourceMap<GPUShaderModule, GPUShaderModuleDescriptor>;
  textures: ResourceMap<GPUTexture, GPUTextureDescriptor>;
  samplers: ResourceMap<GPUSampler, GPUSamplerDescriptor>;
  buffers: ResourceMap<GPUBuffer, GPUBufferDescriptor>;
  bindGroups: ResourceMap<GPUBindGroup, GPUBindGroupDescriptor>;
  bindGroupLayouts: ResourceMap<GPUBindGroupLayout, GPUBindGroupLayoutDescriptor>;
  commandEncoders: ResourceMap<GPUCommandEncoder, GPUCommandEncoderDescriptor>;
  querySets: ResourceMap<GPUQuerySet, GPUQuerySetDescriptor>;

  render: {
    bundleEncoders: ResourceMap<GPURenderBundleEncoder, GPURenderBundleEncoderDescriptor>;
    pipelines: ResourceMap<GPURenderPipeline, GPURenderPipelineDescriptor>;
    layouts: ResourceMap<GPUPipelineLayout, GPUPipelineLayoutDescriptor>;
  };
  compute: {
    pipelines: ResourceMap<GPUComputePipeline, GPUComputePipelineDescriptor>;
    layouts: ResourceMap<GPUPipelineLayout, GPUPipelineLayoutDescriptor>;
  };

  constructor(backend: Backend) {
    this.textures = ResourceMap.as(
      descriptor => backend.device.createTexture(descriptor),
      texture => texture.destroy(),
    );
    this.samplers = ResourceMap.as(descriptor => backend.device.createSampler(descriptor));
    this.buffers = ResourceMap.as(
      descriptor => backend.device.createBuffer(descriptor),
      buffer => buffer.destroy(),
    );
    this.bindGroups = ResourceMap.as(descriptor => backend.device.createBindGroup(descriptor));
    this.bindGroupLayouts = ResourceMap.as(descriptor => backend.device.createBindGroupLayout(descriptor));
    this.commandEncoders = ResourceMap.as(descriptor => backend.device.createCommandEncoder(descriptor));

    this.querySets = ResourceMap.as(
      descriptor => backend.device.createQuerySet(descriptor),
      set => set.destroy(),
    );

    this.shaders = ResourceMap.as(descriptor => backend.device.createShaderModule(descriptor));

    this.compute = {
      layouts: ResourceMap.as(descriptor => backend.device.createPipelineLayout(descriptor)),
      pipelines: ResourceMap.as(descriptor => backend.device.createComputePipeline(descriptor)),
    };

    this.render = {
      bundleEncoders: ResourceMap.as(descriptor => backend.device.createRenderBundleEncoder(descriptor)),
      pipelines: ResourceMap.as(descriptor => backend.device.createRenderPipeline(descriptor)),
      layouts: ResourceMap.as(descriptor => backend.device.createPipelineLayout(descriptor)),
    };
  }
}
