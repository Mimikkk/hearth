import { Backend } from '@modules/renderer/engine/hearth/Backend.js';
import { ResourceMap } from '@modules/renderer/engine/hearth/memo/ResourceMap.js';
import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';

export class HearthResources {
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

  constructor(hearth: Hearth) {
    this.textures = ResourceMap.as(
      descriptor => hearth.backend.device.createTexture(descriptor),
      texture => texture.destroy(),
    );
    this.samplers = ResourceMap.as(descriptor => hearth.backend.device.createSampler(descriptor));
    this.buffers = ResourceMap.as(
      descriptor => hearth.backend.device.createBuffer(descriptor),
      buffer => buffer.destroy(),
    );
    this.bindGroups = ResourceMap.as(descriptor => hearth.backend.device.createBindGroup(descriptor));
    this.bindGroupLayouts = ResourceMap.as(descriptor => hearth.backend.device.createBindGroupLayout(descriptor));
    this.commandEncoders = ResourceMap.as(descriptor => hearth.backend.device.createCommandEncoder(descriptor));

    this.querySets = ResourceMap.as(
      descriptor => hearth.backend.device.createQuerySet(descriptor),
      set => set.destroy(),
    );

    this.shaders = ResourceMap.as(descriptor => hearth.backend.device.createShaderModule(descriptor));

    this.compute = {
      layouts: ResourceMap.as(descriptor => hearth.backend.device.createPipelineLayout(descriptor)),
      pipelines: ResourceMap.as(descriptor => hearth.backend.device.createComputePipeline(descriptor)),
    };

    this.render = {
      bundleEncoders: ResourceMap.as(descriptor => hearth.backend.device.createRenderBundleEncoder(descriptor)),
      pipelines: ResourceMap.as(descriptor => hearth.backend.device.createRenderPipeline(descriptor)),
      layouts: ResourceMap.as(descriptor => hearth.backend.device.createPipelineLayout(descriptor)),
    };
  }
}
