import {
  GPUIndexFormatType,
  GPULoadOpType,
  GPUPrimitiveTopologyType,
  GPUStoreOpType,
  GPUTextureViewDimensionType,
} from './constants.js';

import { Backend } from '@modules/renderer/engine/renderers/webgpu/Backend.js';
import { MipmapShader } from '@modules/renderer/engine/renderers/webgpu/utils/shaders/MipmapShader.js';
import { CacheMap } from '@modules/renderer/engine/renderers/webgpu/utils/CacheMap.js';

const encodePass = (
  device: GPUDevice,
  sampler: GPUSampler,
  commandEncoder: GPUCommandEncoder,
  pipeline: GPURenderPipeline,
  source: GPUTextureView,
  destination: GPUTextureView,
) => {
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: sampler,
      },
      {
        binding: 1,
        resource: source,
      },
    ],
  });

  const passEncoder = commandEncoder.beginRenderPass({
    colorAttachments: [
      {
        view: destination,
        loadOp: GPULoadOpType.Clear,
        storeOp: GPUStoreOpType.Store,
        clearValue: [0, 0, 0, 0],
      },
    ],
  });

  passEncoder.setPipeline(pipeline);
  passEncoder.setBindGroup(0, bindGroup);
  passEncoder.draw(4, 1, 0, 0);
  passEncoder.end();
};

const mipmapLabel = (format: GPUTextureFormat) => `mipmap-${format}`;
const transferLabel = (format: GPUTextureFormat) => `${mipmapLabel(format)}-transfer`;
const flipYLabel = (format: GPUTextureFormat) => `${mipmapLabel(format)}-flip_y`;

export class BackendTexturePass {
  transferPipelines = new CacheMap(
    (format: GPUTextureFormat) => {
      const { render, bindGroupLayouts } = this.backend.resources;
      const label = mipmapLabel(format);

      return render.pipelines.get(transferLabel(format), () => ({
        label,
        vertex: this.mipmap.vertexState(),
        fragment: this.mipmap.fragmentState(format, false),
        primitive: {
          topology: GPUPrimitiveTopologyType.TriangleStrip,
          stripIndexFormat: GPUIndexFormatType.Uint32,
        },
        layout: render.layouts.get(`${label}-layout`, () => ({
          bindGroupLayouts: [
            bindGroupLayouts.get(`${label}-bind-group`, () => ({
              entries: [
                {
                  binding: 0,
                  visibility: GPUShaderStage.FRAGMENT,
                  sampler: { type: 'filtering' },
                },
                {
                  binding: 1,
                  visibility: GPUShaderStage.FRAGMENT,
                  texture: {
                    sampleType: 'float',
                    viewDimension: '2d',
                  },
                },
              ],
            })),
          ],
        })),
      }));
    },
    (pipeline, format) => {
      const { render, bindGroupLayouts } = this.backend.resources;
      const label = mipmapLabel(format);

      render.pipelines.delete(pipeline.label);
      render.layouts.remove(`${label}-layout`);
      bindGroupLayouts.remove(`${label}-bind-group`);
    },
  );
  flipYPipelines = new CacheMap(
    (format: GPUTextureFormat) => {
      const { render, bindGroupLayouts } = this.backend.resources;
      const label = mipmapLabel(format);

      return render.pipelines.get(flipYLabel(format), () => ({
        vertex: this.mipmap.vertexState(),
        fragment: this.mipmap.fragmentState(format, true),
        primitive: {
          topology: GPUPrimitiveTopologyType.TriangleStrip,
          stripIndexFormat: GPUIndexFormatType.Uint32,
        },
        layout: render.layouts.get(`${label}-layout`, () => ({
          bindGroupLayouts: [
            bindGroupLayouts.get(`${label}-bind-group`, () => ({
              entries: [
                {
                  binding: 0,
                  visibility: GPUShaderStage.FRAGMENT,
                  sampler: { type: 'filtering' },
                },
                {
                  binding: 1,
                  visibility: GPUShaderStage.FRAGMENT,
                  texture: {
                    sampleType: 'float',
                    viewDimension: '2d',
                  },
                },
              ],
            })),
          ],
        })),
      }));
    },
    (pipeline, format) => {
      const { render, bindGroupLayouts } = this.backend.resources;
      const label = mipmapLabel(format);

      render.pipelines.delete(pipeline.label);
      render.layouts.remove(`${label}-layout`);
      bindGroupLayouts.remove(`${label}-bind-group`);
    },
  );
  mipmap: MipmapShader;

  constructor(public backend: Backend) {
    this.mipmap = new MipmapShader(backend);
  }

  flipY(texture: GPUTexture, descriptor: GPUTextureDescriptor, layer: number): void {
    const format = descriptor.format;
    const { width, height } = descriptor.size as GPUExtent3DDictStrict;

    const transferPipeline = this.transferPipelines.get(format);
    const flipYPipeline = this.flipYPipelines.get(format);

    const temporaryTexture = this.backend.resources.textures.set({
      label: 'mipmap-temporary-texture',
      size: { width, height, depthOrArrayLayers: 1 },
      format,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });
    const sourceView = texture.createView({
      baseMipLevel: 0,
      mipLevelCount: 1,
      dimension: GPUTextureViewDimensionType.TwoD,
      baseArrayLayer: layer,
    });
    const destinationView = temporaryTexture.createView({
      baseMipLevel: 0,
      mipLevelCount: 1,
      dimension: GPUTextureViewDimensionType.TwoD,
      baseArrayLayer: 0,
    });
    const commandEncoder = this.backend.device.createCommandEncoder();

    encodePass(
      this.backend.device,
      this.mipmap.samplerNearest,
      commandEncoder,
      transferPipeline,
      sourceView,
      destinationView,
    );
    encodePass(
      this.backend.device,
      this.mipmap.samplerNearest,
      commandEncoder,
      flipYPipeline,
      destinationView,
      sourceView,
    );

    this.backend.device.queue.submit([commandEncoder.finish()]);
    this.backend.resources.textures.delete('mipmap-temporary-texture');
  }

  generateMipmaps(texture: GPUTexture, descriptor: GPUTextureDescriptor, layer: number): void {
    const pipeline = this.transferPipelines.get(descriptor.format);
    const { commandEncoders, bindGroups } = this.backend.resources;

    const commandEncoder = commandEncoders.create({ label: 'mipmap-encoder' }, 'mipmap-encoder');
    const bindGroupLayout = pipeline.getBindGroupLayout(0);

    let source = texture.createView({
      baseMipLevel: 0,
      mipLevelCount: 1,
      dimension: GPUTextureViewDimensionType.TwoD,
      baseArrayLayer: layer,
    });

    for (let i = 1; i < descriptor.mipLevelCount!; i++) {
      const bindGroup = bindGroups.create(
        {
          label: `mipmap-${i}`,
          layout: bindGroupLayout,
          entries: [
            {
              binding: 0,
              resource: this.mipmap.samplerLinear,
            },
            {
              binding: 1,
              resource: source,
            },
          ],
        },
        `mipmap-${i}`,
      );

      const destination = texture.createView({
        baseMipLevel: i,
        mipLevelCount: 1,
        dimension: GPUTextureViewDimensionType.TwoD,
        baseArrayLayer: layer,
      });

      const passEncoder = commandEncoder.beginRenderPass({
        colorAttachments: [
          {
            view: destination,
            loadOp: GPULoadOpType.Clear,
            storeOp: GPUStoreOpType.Store,
            clearValue: [0, 0, 0, 0],
          },
        ],
      });

      passEncoder.setPipeline(pipeline);
      passEncoder.setBindGroup(0, bindGroup);
      passEncoder.draw(4, 1, 0, 0);
      passEncoder.end();

      source = destination;
    }

    this.backend.device.queue.submit([commandEncoder.finish()]);
  }

  dispose() {
    this.transferPipelines.clear();
    this.flipYPipelines.clear();
  }
}
