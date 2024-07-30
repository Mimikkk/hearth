import DataMap from './memo/DataMap.js';
import {
  AttributeLocation,
  GPUBufferBindingTypeType,
  GPUTextureAspectType,
  GPUTextureSampleTypeType,
  GPUTextureViewDimensionType,
} from './constants.js';
import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';
import RenderObject from '@modules/renderer/engine/hearth/core/RenderObject.js';
import Binding from '@modules/renderer/engine/hearth/bindings/Binding.js';
import {
  BindingSampledCubeTexture,
  BindingSampledTexture,
} from '@modules/renderer/engine/hearth/bindings/BindingSampledTexture.js';
import BindingUniformBuffer from '@modules/renderer/engine/hearth/bindings/BindingUniformBuffer.js';
import StorageTexture from '@modules/renderer/engine/entities/textures/StorageTexture.js';
import BindingStorageBuffer from '@modules/renderer/engine/hearth/bindings/BindingStorageBuffer.js';
import { ComputeNode } from '@modules/renderer/engine/nodes/Nodes.js';
import { NodeUniformsGroup } from '@modules/renderer/engine/nodes/builder/NodeStorageBuffer.js';
import BindingBuffer from '@modules/renderer/engine/hearth/bindings/BindingBuffer.js';
import { TextureDataType } from '@modules/renderer/engine/constants.js';
import BindingSampler from '@modules/renderer/engine/hearth/bindings/BindingSampler.js';
import { DepthTexture } from '@modules/renderer/engine/entities/textures/DepthTexture.js';
import { VideoTexture } from '@modules/renderer/engine/entities/textures/VideoTexture.js';
import { DataTexture } from '@modules/renderer/engine/entities/textures/DataTexture.js';
import { DataArrayTexture } from '@modules/renderer/engine/entities/textures/DataArrayTexture.js';

export class HearthBindings extends DataMap<any, any> {
  constructor(public hearth: Hearth) {
    super();
  }

  getForRender(renderObject: RenderObject): Binding[] {
    const bindings = renderObject.getBindings();

    const data = this.get(renderObject);

    if (data.bindings !== bindings) {
      data.bindings = bindings;

      this._init(bindings);

      this.hearth.createBindings(bindings);
    }

    return data.bindings;
  }

  getForCompute(computeNode: ComputeNode): Binding[] {
    const data = this.get(computeNode);

    if (data.bindings === undefined) {
      const nodeBuilderState = this.hearth.nodes.getForCompute(computeNode);

      const bindings = nodeBuilderState.bindings;

      data.bindings = bindings;

      this._init(bindings);

      this.hearth.createBindings(bindings);
    }

    return data.bindings;
  }

  updateForCompute(computeNode: ComputeNode): void {
    this.update(this.getForCompute(computeNode));
  }

  updateForRender(renderObject: RenderObject): void {
    this.update(this.getForRender(renderObject));
  }

  _init(bindings: Binding[]): void {
    for (const binding of bindings) {
      if (binding instanceof BindingSampledTexture) {
        this.hearth.textures.updateTexture(binding.texture);
      } else if (binding instanceof BindingStorageBuffer) {
        const attribute = binding.attribute;

        this.hearth.attributes.update(attribute, AttributeLocation.Storage);
      }
    }
  }

  update(bindings: Binding[]): void {
    let needsBindingsUpdate = false;

    for (const binding of bindings) {
      if (binding instanceof NodeUniformsGroup) {
        const updated = this.hearth.nodes.updateGroup(binding);

        if (!updated) continue;
      }

      if (binding instanceof BindingUniformBuffer) {
        const updated = binding.update();

        if (updated) {
          this.hearth.updateBinding(binding);
        }
      } else if (binding instanceof BindingSampledTexture) {
        const texture = binding.texture;

        if (binding.needsBindingsUpdate) needsBindingsUpdate = true;

        const updated = binding.update();

        if (updated) {
          this.hearth.textures.updateTexture(binding.texture);
        }

        if (texture instanceof StorageTexture) {
          const textureData = this.get(texture);

          if (binding.store === true) {
            textureData.needsMipmap = true;
          } else if (
            texture.generateMipmaps === true &&
            this.hearth.textures.needsMipmaps(texture) &&
            textureData.needsMipmap === true
          ) {
            this.hearth.generateMipmaps(texture);

            textureData.needsMipmap = false;
          }
        }
      }
    }

    if (needsBindingsUpdate === true) {
      this.hearth.updateBindings(bindings);
    }
  }

  create(bindings: Binding[]) {
    const data = this.hearth.memo.get(bindings);

    const layout = this.layout(bindings);
    const group = this.createGroup(bindings, layout);

    data.layout = layout;
    data.group = group;
    data.bindings = bindings;
  }

  layout(bindings: Binding[]): GPUBindGroupLayout {
    const device = this.hearth.device;

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
        const format = this.hearth.memo.get(binding.texture).texture.format;

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

  updateBinding(binding: Binding): void {
    const { device, memo } = this.hearth;

    const from = binding.buffer;
    const into = memo.get(binding).buffer as GPUBuffer;

    device.queue.writeBuffer(into, 0, from, 0);
  }

  createGroup(bindings: Binding[], layout: GPUBindGroupLayout): GPUBindGroup {
    const { memo, device } = this.hearth;

    const entries = [];
    for (let i = 0; i < bindings.length; ++i) {
      const binding = bindings[i];

      if (isUniformBuffer(binding)) {
        const data = memo.get<{ buffer?: GPUBuffer }>(binding);

        if (data.buffer === undefined) {
          data.buffer = device.createBuffer({
            label: 'bindingBuffer_' + binding.name,
            size: binding.byteLength,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
          });
        }

        entries.push({ binding: i, resource: { buffer: data.buffer } });
      } else if (isStorageBuffer(binding)) {
        const data = memo.get<{ buffer?: GPUBuffer }>(binding);

        if (data.buffer === undefined) {
          data.buffer = memo.get(binding.attribute).buffer;
        }

        entries.push({ binding: i, resource: { buffer: data.buffer } });
      } else if (isSampler(binding)) {
        const { sampler: resource } = memo.get(binding.texture);

        entries.push({ binding: i, resource });
      } else if (isSampledTexture(binding)) {
        const data = memo.get<{
          texture: GPUTexture;
          mipLevelCount: number;
          externalTexture?: VideoFrame;
        }>(binding.texture);

        let view;
        if (isSampledCubeTexture(binding)) {
          view = GPUTextureViewDimensionType.Cube;
        } else if (isDataArrayTexture(binding.texture)) {
          view = GPUTextureViewDimensionType.TwoDArray;
        } else {
          view = GPUTextureViewDimensionType.TwoD;
        }

        let resource = data.externalTexture
          ? device.importExternalTexture({ source: data.externalTexture })
          : data.texture.createView({
              aspect: GPUTextureAspectType.All,
              dimension: view,
              mipLevelCount: binding.store ? 1 : data.mipLevelCount,
            });

        entries.push({ binding: i, resource });
      }
    }

    return device.createBindGroup({ layout, entries });
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
