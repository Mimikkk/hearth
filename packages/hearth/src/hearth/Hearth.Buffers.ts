import { HearthComponent } from './Hearth.Component.js';
import { Texture } from '../entities/textures/Texture.js';
import { DepthTexture } from '../entities/textures/DepthTexture.js';
import { GPULoadOpType, GPUTextureFormatType } from './constants.js';
import { TextureDataType, TextureFormat } from '../constants.js';

export class HearthBuffers extends HearthComponent {
  color?: GPUTexture;
  depth?: GPUTexture;
  #depth = new DepthTexture({ name: 'depth-buffer' });

  useColor(): GPUTexture {
    if (this.color) this.color.destroy();

    const { width, height } = this.hearth.getDrawSize();
    this.color = this.hearth.device.createTexture({
      label: 'HearthBuffers: color',
      size: { width, height, depthOrArrayLayers: 1 },
      sampleCount: this.hearth.parameters.sampleCount,
      format: GPUTextureFormatType.BGRA8Unorm,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
    });

    return this.color;
  }

  useDepthStencil(useDepth: boolean, useStencil: boolean): GPUTexture {
    const { width, height } = this.hearth.getDrawSize();

    const cpuTexture = this.#depth;
    const gpuTexture = this.depth;

    let format!: TextureFormat;
    let type!: TextureDataType;

    if (useStencil) {
      format = TextureFormat.DepthStencil;
      type = TextureDataType.UnsignedInt248;
    } else if (useDepth) {
      format = TextureFormat.Depth;
      type = TextureDataType.UnsignedInt;
    }

    if (gpuTexture) {
      if (
        cpuTexture.image.width === width &&
        cpuTexture.image.height === height &&
        cpuTexture.format === format &&
        cpuTexture.type === type
      ) {
        return gpuTexture;
      }

      this.hearth.textures.destroyTexture(cpuTexture);
    }

    cpuTexture.format = format;
    cpuTexture.type = type;
    cpuTexture.image.width = width;
    cpuTexture.image.height = height;

    this.hearth.textures.createTexture(cpuTexture, {
      sampleCount: this.hearth.parameters.sampleCount,
      width,
      height,
    });
    this.depth = this.hearth.memo.get(cpuTexture).texture;

    return this.depth!;
  }

  readFramebuffer(into: Texture): void {
    this.hearth.textures.updateTexture(into);

    const context = this.hearth.context!;
    const data = this.hearth.memo.get(context);

    const { encoder, descriptor } = data;

    const source = this.#readFramebufferSource(into);
    const destination = this.hearth.memo.get(into).texture as Texture;

    if (source.format !== destination.format) {
      throw new Error(
        `Hearth:Framebuffer: Source and destination format mismatch. source:${source.format} - destination:${destination.format}`,
      );
    }

    data.pass.end();

    encoder.copyTextureToTexture(
      {
        texture: source,
        origin: { x: 0, y: 0, z: 0 },
      },
      {
        texture: destination,
      },
      [into.image.width, into.image.height],
    );

    if (into.useMipmap) this.hearth.textures.useMipmap(into);

    descriptor.colorAttachments[0].loadOp = GPULoadOpType.Load;
    if (context.useDepth) descriptor.depthStencilAttachment.depthLoadOp = GPULoadOpType.Load;
    if (context.useStencil) descriptor.depthStencilAttachment.stencilLoadOp = GPULoadOpType.Load;

    data.pass = encoder.beginRenderPass(descriptor);
    data.sets = { attributes: {} };
  }

  #readFramebufferSource(value: Texture) {
    const context = this.hearth.context!;

    if (context.target) {
      if (DepthTexture.is(value)) {
        return this.hearth.memo.get(context.depthTexture).texture;
      }

      return this.hearth.memo.get(context.textures![0]).texture;
    }

    if (DepthTexture.is(value)) {
      return this.useDepthStencil(context.useDepth, context.useStencil);
    }

    return this.hearth.parameters.context.getCurrentTexture();
  }
}
