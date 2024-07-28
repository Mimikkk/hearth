import {
  GPUBufferBindingTypeType,
  GPUTextureAspectType,
  GPUTextureSampleTypeType,
  GPUTextureViewDimensionType,
} from './constants.js';
import { DataArrayTexture, DataTexture, DepthTexture, TextureDataType, VideoTexture } from '../engine.js';
import { Backend } from '@modules/renderer/engine/renderers/Backend.js';
import Binding from '@modules/renderer/engine/renderers/Binding.js';
import UniformBuffer from '@modules/renderer/engine/renderers/UniformBuffer.js';
import { SampledCubeTexture, SampledTexture } from '@modules/renderer/engine/renderers/SampledTexture.js';
import StorageBuffer from '@modules/renderer/engine/nodes/core/StorageBuffer.js';
import Sampler from '@modules/renderer/engine/renderers/Sampler.js';

export class BackendBindings {
  constructor(public backend: Backend) {}

  layout(bindings: Binding[]): GPUBindGroupLayout {
    const device = this.backend.device;

    const entries = [];

    let index = 0;

    for (const binding of bindings) {
      const bindingGPU: GPUBindGroupLayoutEntry = {
        binding: index++,
        visibility: binding.visibility,
      };

      if (isUniformBuffer(binding) || isStorageBuffer(binding)) {
        const buffer: GPUBufferBindingLayout = {};

        if (isStorageBuffer(binding)) {
          buffer.type = GPUBufferBindingTypeType.Storage;
        }

        bindingGPU.buffer = buffer;
      } else if (isSampler(binding)) {
        const sampler: GPUSamplerBindingLayout = {};

        if (isDepthTexture(binding.texture)) {
          if (binding.texture.compareFunction !== null) {
            sampler.type = 'comparison';
          }
        }

        bindingGPU.sampler = sampler;
      } else if (isSampledTexture(binding) && isVideoTexture(binding.texture)) {
        bindingGPU.externalTexture = {} satisfies GPUExternalTextureBindingLayout;
      } else if (isSampledTexture(binding) && binding.store) {
        const format = this.backend.memo.get(binding.texture).texture.format;

        bindingGPU.storageTexture = { format } satisfies GPUStorageTextureBindingLayout;
      } else if (isSampledTexture(binding)) {
        const texture: GPUTextureBindingLayout = {};

        if (isDepthTexture(binding.texture)) {
          texture.sampleType = GPUTextureSampleTypeType.Depth;
        } else if (isDataTexture(binding.texture) && binding.texture.type === TextureDataType.Float) {
          // @TODO: Add support for this soon: backend.hasFeature( 'float32-filterable' )

          texture.sampleType = GPUTextureSampleTypeType.UnfilterableFloat;
        }

        if (isSampledCubeTexture(binding)) {
          texture.viewDimension = GPUTextureViewDimensionType.Cube;
        } else if (isDataArrayTexture(binding.texture)) {
          texture.viewDimension = GPUTextureViewDimensionType.TwoDArray;
        }

        bindingGPU.texture = texture;
      } else {
        console.error(`WebGPUBindingUtils: Unsupported binding "${binding}".`);
      }

      entries.push(bindingGPU);
    }

    return device.createBindGroupLayout({ entries });
  }

  create(bindings: Binding[]) {
    const backend = this.backend;
    const bindingsData = backend.memo.get(bindings);

    // setup (static) binding layout and (dynamic) binding group

    const bindLayoutGPU = this.layout(bindings);
    const bindGroupGPU = this.createGroup(bindings, bindLayoutGPU);

    bindingsData.layout = bindLayoutGPU;
    bindingsData.group = bindGroupGPU;
    bindingsData.bindings = bindings;
  }

  update(binding: Binding) {
    const backend = this.backend;
    const device = backend.device;

    const buffer = binding.buffer;
    const bufferGPU = backend.memo.get(binding).buffer;

    device.queue.writeBuffer(bufferGPU, 0, buffer, 0);
  }

  createGroup(bindings: Binding[], layoutGPU: GPUBindGroupLayout): GPUBindGroup {
    const backend = this.backend;
    const device = backend.device;

    let bindingPoint = 0;
    const entriesGPU = [];

    for (const binding of bindings) {
      if (isUniformBuffer(binding)) {
        const bindingData = backend.memo.get(binding);

        if (bindingData.buffer === undefined) {
          const byteLength = binding.byteLength;

          const usage = GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST;

          const bufferGPU = device.createBuffer({
            label: 'bindingBuffer_' + binding.name,
            size: byteLength,
            usage: usage,
          });

          bindingData.buffer = bufferGPU;
        }

        entriesGPU.push({ binding: bindingPoint, resource: { buffer: bindingData.buffer } });
      } else if (isStorageBuffer(binding)) {
        const bindingData = backend.memo.get(binding);

        if (bindingData.buffer === undefined) {
          const attribute = binding.attribute;

          bindingData.buffer = backend.memo.get(attribute).buffer;
        }

        entriesGPU.push({ binding: bindingPoint, resource: { buffer: bindingData.buffer } });
      } else if (isSampler(binding)) {
        const textureGPU = backend.memo.get(binding.texture);

        entriesGPU.push({ binding: bindingPoint, resource: textureGPU.sampler });
      } else if (isSampledTexture(binding)) {
        const textureData = backend.memo.get(binding.texture);

        let dimensionViewGPU;

        if (isSampledCubeTexture(binding)) {
          dimensionViewGPU = GPUTextureViewDimensionType.Cube;
        } else if (isDataArrayTexture(binding.texture)) {
          dimensionViewGPU = GPUTextureViewDimensionType.TwoDArray;
        } else {
          dimensionViewGPU = GPUTextureViewDimensionType.TwoD;
        }

        let resourceGPU;

        if (textureData.externalTexture !== undefined) {
          resourceGPU = device.importExternalTexture({ source: textureData.externalTexture });
        } else {
          const aspectGPU = GPUTextureAspectType.All;

          resourceGPU = textureData.texture.createView({
            aspect: aspectGPU,
            dimension: dimensionViewGPU,
            mipLevelCount: binding.store ? 1 : textureData.mipLevelCount,
          });
        }

        entriesGPU.push({ binding: bindingPoint, resource: resourceGPU });
      }

      bindingPoint++;
    }

    return device.createBindGroup({
      layout: layoutGPU,
      entries: entriesGPU,
    });
  }
}

const isUniformBuffer = (item: any): item is UniformBuffer => item.isUniformBuffer;
const isStorageBuffer = (item: any): item is StorageBuffer => item.isStorageBuffer;
const isSampler = (item: any): item is Sampler => item.isSampler;
const isDepthTexture = (item: any): item is DepthTexture => item.isDepthTexture;
const isSampledTexture = (item: any): item is SampledTexture => item.isSampledTexture;
const isVideoTexture = (item: any): item is VideoTexture => item.isVideoTexture;
const isSampledCubeTexture = (item: any): item is SampledCubeTexture => item.isSampledCubeTexture;
const isDataTexture = (item: any): item is DataTexture => item.isDataTexture;
const isDataArrayTexture = (item: any): item is DataArrayTexture => item.isDataArrayTexture;
