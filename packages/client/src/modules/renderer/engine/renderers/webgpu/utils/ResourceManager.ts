import { Backend } from '@modules/renderer/engine/renderers/webgpu/Backend.js';
import { Label, ResourceMap } from '@modules/renderer/engine/renderers/webgpu/utils/ResourceMap.js';

export class ResourceManager {
  shaderMap: ResourceMap<GPUShaderModule, GPUShaderModuleDescriptor>;
  textureMap: ResourceMap<GPUTexture, GPUTextureDescriptor>;
  samplerMap: ResourceMap<GPUSampler, GPUSamplerDescriptor>;
  bufferMap: ResourceMap<GPUBuffer, GPUBufferDescriptor>;
  bindGroupMap: ResourceMap<GPUBindGroup, GPUBindGroupDescriptor>;
  bindGroupLayoutMap: ResourceMap<GPUBindGroupLayout, GPUBindGroupLayoutDescriptor>;
  commandEncoderMap: ResourceMap<GPUCommandEncoder, GPUCommandEncoderDescriptor>;
  querySetMap: ResourceMap<GPUQuerySet, GPUQuerySetDescriptor>;
  renderBundleEncoderMap: ResourceMap<GPURenderBundleEncoder, GPURenderBundleEncoderDescriptor>;
  renderPipelineMap: ResourceMap<GPURenderPipeline, GPURenderPipelineDescriptor>;
  renderPipelineLayoutMap: ResourceMap<GPUPipelineLayout, GPUPipelineLayoutDescriptor>;
  computePipelineMap: ResourceMap<GPUComputePipeline, GPUComputePipelineDescriptor>;
  computePipelineLayoutMap: ResourceMap<GPUPipelineLayout, GPUPipelineLayoutDescriptor>;

  constructor(backend: Backend) {
    this.textureMap = ResourceMap.as(
      descriptor => backend.device.createTexture(descriptor),
      texture => texture.destroy(),
    );
    this.samplerMap = ResourceMap.as(descriptor => backend.device.createSampler(descriptor));
    this.bufferMap = ResourceMap.as(
      descriptor => backend.device.createBuffer(descriptor),
      buffer => buffer.destroy(),
    );
    this.bindGroupMap = ResourceMap.as(descriptor => backend.device.createBindGroup(descriptor));
    this.bindGroupLayoutMap = ResourceMap.as(descriptor => backend.device.createBindGroupLayout(descriptor));
    this.commandEncoderMap = ResourceMap.as(descriptor => backend.device.createCommandEncoder(descriptor));

    this.querySetMap = ResourceMap.as(
      descriptor => backend.device.createQuerySet(descriptor),
      set => set.destroy(),
    );

    this.shaderMap = ResourceMap.as(descriptor => backend.device.createShaderModule(descriptor));

    this.computePipelineMap = ResourceMap.as(descriptor => backend.device.createComputePipeline(descriptor));
    this.computePipelineLayoutMap = ResourceMap.as(descriptor => backend.device.createPipelineLayout(descriptor));

    this.renderBundleEncoderMap = ResourceMap.as(descriptor => backend.device.createRenderBundleEncoder(descriptor));
    this.renderPipelineMap = ResourceMap.as(descriptor => backend.device.createRenderPipeline(descriptor));
    this.renderPipelineLayoutMap = ResourceMap.as(descriptor => backend.device.createPipelineLayout(descriptor));
  }

  shader<L extends string>(descriptor: Label<L, GPUShaderModuleDescriptor>): GPUShaderModule {
    return this.shaderMap.get(descriptor.label, () => descriptor);
  }

  texture<L extends string>(descriptor: Label<L, GPUTextureDescriptor>): GPUTexture {
    return this.textureMap.get(descriptor.label, () => descriptor);
  }

  sampler<L extends string>(descriptor: Label<L, GPUSamplerDescriptor>): GPUSampler {
    return this.samplerMap.get(descriptor.label, () => descriptor);
  }

  buffer<L extends string>(descriptor: Label<L, GPUBufferDescriptor>): GPUBuffer {
    return this.bufferMap.get(descriptor.label, () => descriptor);
  }

  bindGroup<L extends string>(descriptor: Label<L, GPUBindGroupDescriptor>): GPUBindGroup {
    return this.bindGroupMap.create(descriptor);
  }

  bindGroups<L extends string>(...descriptors: Label<L, GPUBindGroupDescriptor>[]): GPUBindGroup[] {
    return descriptors.map(descriptor => this.bindGroup(descriptor));
  }

  bindGroupLayout<L extends string>(descriptor: Label<L, GPUBindGroupLayoutDescriptor>): GPUBindGroupLayout {
    return this.bindGroupLayoutMap.create(descriptor);
  }

  bindGroupLayouts<L extends string>(...descriptors: Label<L, GPUBindGroupLayoutDescriptor>[]): GPUBindGroupLayout[] {
    return descriptors.map(descriptor => this.bindGroupLayout(descriptor));
  }

  commandEncoder<L extends string>(descriptor: Label<L, GPUCommandEncoderDescriptor>): GPUCommandEncoder {
    return this.commandEncoderMap.create(descriptor);
  }

  querySet<L extends string>(descriptor: Label<L, GPUQuerySetDescriptor>): GPUQuerySet {
    return this.querySetMap.get(descriptor.label, () => descriptor);
  }

  computePipeline<L extends string>(descriptor: Label<L, GPUComputePipelineDescriptor>): GPUComputePipeline {
    return this.computePipelineMap.get(descriptor.label, () => descriptor);
  }

  computePipelineLayout<L extends string>(descriptor: Label<L, GPUPipelineLayoutDescriptor>): GPUPipelineLayout {
    return this.computePipelineLayoutMap.get(descriptor.label, () => descriptor);
  }

  renderPipeline<L extends string>(descriptor: Label<L, GPURenderPipelineDescriptor>): GPURenderPipeline {
    return this.renderPipelineMap.get(descriptor.label, () => descriptor);
  }

  renderPipelineLayout<L extends string>(descriptor: Label<L, GPUPipelineLayoutDescriptor>): GPUPipelineLayout {
    return this.renderPipelineLayoutMap.get(descriptor.label, () => descriptor);
  }

  renderBundleEncoder<L extends string>(
    descriptor: Label<L, GPURenderBundleEncoderDescriptor>,
  ): GPURenderBundleEncoder {
    return this.renderBundleEncoderMap.get(descriptor.label, () => descriptor);
  }

  dispose(): void {
    this.shaderMap.clear();
    this.textureMap.clear();
    this.samplerMap.clear();
    this.bufferMap.clear();
    this.bindGroupMap.clear();
    this.bindGroupLayoutMap.clear();
    this.commandEncoderMap.clear();
    this.querySetMap.clear();
    this.computePipelineMap.clear();
    this.computePipelineLayoutMap.clear();
    this.renderPipelineMap.clear();
    this.renderPipelineLayoutMap.clear();
    this.renderBundleEncoderMap.clear();
  }
}
