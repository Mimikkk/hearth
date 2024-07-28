import {
  GPUBufferBindingTypeType,
  GPUTextureAspectType,
  GPUTextureSampleTypeType,
  GPUTextureViewDimensionType,
} from '../constants.js';
import { DataArrayTexture, DataTexture, DepthTexture, TextureDataType, VideoTexture } from '../../engine.js';
import { Backend } from '@modules/renderer/engine/renderers/Backend.js';
import Binding from '@modules/renderer/engine/renderers/bindings/Binding.js';
import BindingUniformBuffer from '@modules/renderer/engine/renderers/bindings/BindingUniformBuffer.js';
import {
  BindingSampledCubeTexture,
  BindingSampledTexture,
} from '@modules/renderer/engine/renderers/bindings/BindingSampledTexture.js';
import BindingStorageBuffer from '@modules/renderer/engine/renderers/bindings/BindingStorageBuffer.js';
import BindingSampler from '@modules/renderer/engine/renderers/bindings/BindingSampler.js';
import BindingBuffer from '@modules/renderer/engine/renderers/bindings/BindingBuffer.js';

export class BackendBindings {
  constructor(public backend: Backend) {}

  create(bindings: Binding[]) {
    const data = this.backend.memo.get(bindings);

    const layout = this.layout(bindings);
    const group = this.createGroup(bindings, layout);

    data.layout = layout;
    data.group = group;
    data.bindings = bindings;
  }

  layout(bindings: Binding[]): GPUBindGroupLayout {
    const device = this.backend.device;

    const entries = [];
    for (let i = 0; i < bindings.length; ++i) {
      const binding = bindings[i];
      const entry: GPUBindGroupLayoutEntry = {
        binding: i,
        visibility: binding.visibility,
      };

      if (BindingBuffer.is(binding)) {
        const buffer: GPUBufferBindingLayout = {
          type: 'uniform',
        };

        if (BindingStorageBuffer.is(binding)) {
          buffer.type = GPUBufferBindingTypeType.Storage;
        }

        entry.buffer = buffer;
      } else if (isSampler(binding)) {
        const sampler: GPUSamplerBindingLayout = {};

        if (isDepthTexture(binding.texture) && binding.texture.compare) {
          sampler.type = 'comparison';
        }

        entry.sampler = sampler;
      } else if (isSampledTexture(binding) && isVideoTexture(binding.texture)) {
        entry.externalTexture = {} satisfies GPUExternalTextureBindingLayout;
      } else if (isSampledTexture(binding) && binding.store) {
        const format = this.backend.memo.get(binding.texture).texture.format;

        entry.storageTexture = { format } satisfies GPUStorageTextureBindingLayout;
      } else if (isSampledTexture(binding)) {
        const texture: GPUTextureBindingLayout = {};

        if (isDepthTexture(binding.texture)) {
          texture.sampleType = GPUTextureSampleTypeType.Depth;
        } else if (isDataTexture(binding.texture) && binding.texture.type === TextureDataType.Float) {
          texture.sampleType = GPUTextureSampleTypeType.UnfilterableFloat;
        }

        if (isSampledCubeTexture(binding)) {
          texture.viewDimension = GPUTextureViewDimensionType.Cube;
        } else if (isDataArrayTexture(binding.texture)) {
          texture.viewDimension = GPUTextureViewDimensionType.TwoDArray;
        }

        entry.texture = texture;
      } else {
        throw new Error(`Bindings: Unsupported binding ${binding}.`);
      }

      entries.push(entry);
    }

    return device.createBindGroupLayout({ entries });
  }

  update(binding: Binding): void {
    const { device, memo } = this.backend;

    const from = binding.buffer;
    const into = memo.get(binding).buffer as GPUBuffer;

    device.queue.writeBuffer(into, 0, from, 0);
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

const isUniformBuffer = (item: any): item is BindingUniformBuffer => item.isUniformBuffer;
const isStorageBuffer = (item: any): item is BindingStorageBuffer<any> => item.isStorageBuffer;
const isSampler = (item: any): item is BindingSampler => item.isSampler;
const isDepthTexture = (item: any): item is DepthTexture => item.isDepthTexture;
const isSampledTexture = (item: any): item is BindingSampledTexture => item.isSampledTexture;
const isVideoTexture = (item: any): item is VideoTexture => item.isVideoTexture;
const isSampledCubeTexture = (item: any): item is BindingSampledCubeTexture => item.isSampledCubeTexture;
const isDataTexture = (item: any): item is DataTexture => item.isDataTexture;
const isDataArrayTexture = (item: any): item is DataArrayTexture => item.isDataArrayTexture;
