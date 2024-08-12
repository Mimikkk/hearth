import { HearthComponent } from '@modules/renderer/engine/hearth/Hearth.Component.js';
import { Texture } from '@modules/renderer/engine/entities/textures/Texture.js';
import { DepthTexture } from '@modules/renderer/engine/entities/textures/DepthTexture.js';
import { GPULoadOpType, GPUTextureFormatType } from '@modules/renderer/engine/hearth/constants.js';

export class HearthBuffers extends HearthComponent {
  readFramebuffer(into: Texture): void {
    this.hearth.textures.updateTexture(into);

    const context = this.hearth.context!;
    const data = this.hearth.memo.get(context);

    const { encoder, descriptor } = data;

    const source = this.#source(into);
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

  color?: GPUTexture;

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

  #source(value: Texture) {
    const context = this.hearth.context!;

    if (context.target) {
      if (DepthTexture.is(value)) {
        return this.hearth.memo.get(context.depthTexture).texture;
      }

      return this.hearth.memo.get(context.textures[0]).texture;
    }

    if (DepthTexture.is(value)) {
      return this.hearth.textures.getDepthBuffer(context.useDepth, context.useStencil);
    }

    return this.hearth.parameters.context.getCurrentTexture();
  }
}
