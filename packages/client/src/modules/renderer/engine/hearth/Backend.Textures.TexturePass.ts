import {
  GPUIndexFormatType,
  GPULoadOpType,
  GPUPrimitiveTopologyType,
  GPUStoreOpType,
  GPUTextureViewDimensionType,
} from './constants.js';
import { HearthTexturesTexturePassMipmapShader } from '@modules/renderer/engine/hearth/Hearth.Textures.TexturePass.MipmapShader.js';
import { Memo } from '@modules/renderer/engine/hearth/memo/Memo.js';
import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';

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

export class BackendTexturesTexturePass {
  transferPipelines = new Memo(
    (format: GPUTextureFormat) => {
      const { render, bindGroupLayouts } = this.hearth.backend.hearth.resources;
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
      const { render, bindGroupLayouts } = this.hearth.backend.hearth.resources;
      const label = mipmapLabel(format);

      render.pipelines.delete(pipeline.label);
      render.layouts.remove(`${label}-layout`);
      bindGroupLayouts.remove(`${label}-bind-group`);
    },
  );
  flipYPipelines = new Memo(
    (format: GPUTextureFormat) => {
      const { render, bindGroupLayouts } = this.hearth.backend.hearth.resources;
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
      const { render, bindGroupLayouts } = this.hearth.backend.hearth.resources;
      const label = mipmapLabel(format);

      render.pipelines.delete(pipeline.label);
      render.layouts.remove(`${label}-layout`);
      bindGroupLayouts.remove(`${label}-bind-group`);
    },
  );
  mipmap: HearthTexturesTexturePassMipmapShader;

  constructor(public hearth: Hearth) {
    this.mipmap = new HearthTexturesTexturePassMipmapShader(hearth);
  }

  flipY(texture: GPUTexture, descriptor: GPUTextureDescriptor, layer: number): void {
    const format = descriptor.format;
    const { width, height } = descriptor.size as GPUExtent3DDictStrict;

    const transferPipeline = this.transferPipelines.get(format);
    const flipYPipeline = this.flipYPipelines.get(format);

    const temporaryTexture = this.hearth.backend.hearth.resources.textures.set({
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
    const commandEncoder = this.hearth.backend.device.createCommandEncoder();

    encodePass(
      this.hearth.backend.device,
      this.mipmap.samplerNearest,
      commandEncoder,
      transferPipeline,
      sourceView,
      destinationView,
    );
    encodePass(
      this.hearth.backend.device,
      this.mipmap.samplerNearest,
      commandEncoder,
      flipYPipeline,
      destinationView,
      sourceView,
    );

    this.hearth.backend.device.queue.submit([commandEncoder.finish()]);
    this.hearth.backend.hearth.resources.textures.delete('mipmap-temporary-texture');
  }

  generateMipmaps(texture: GPUTexture, descriptor: GPUTextureDescriptor, layer: number): void {
    const pipeline = this.transferPipelines.get(descriptor.format);
    const { commandEncoders, bindGroups } = this.hearth.backend.hearth.resources;

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

    this.hearth.backend.device.queue.submit([commandEncoder.finish()]);
  }

  dispose() {
    this.transferPipelines.clear();
    this.flipYPipelines.clear();
  }
}
