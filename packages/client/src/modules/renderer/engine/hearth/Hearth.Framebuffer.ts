import { HearthComponent } from '@modules/renderer/engine/hearth/Hearth.Component.js';
import { Texture } from '@modules/renderer/engine/entities/textures/Texture.js';
import { DepthTexture } from '@modules/renderer/engine/entities/textures/DepthTexture.js';
import { GPULoadOpType } from '@modules/renderer/engine/hearth/constants.js';

export class HearthFramebuffer extends HearthComponent {
  read(into: Texture): void {
    this.hearth.textures.updateTexture(into);

    const context = this.hearth.context!;
    const data = this.hearth.memo.get(context);

    const { encoder, descriptor } = data;

    let sourceGPU = this.#source(into);

    const destinationGPU = this.hearth.memo.get(into).texture;

    if (sourceGPU.format !== destinationGPU.format) {
      console.error(
        'Hearth: readFramebuffer: Source and destination formats do not match.',
        sourceGPU.format,
        destinationGPU.format,
      );

      return;
    }

    data.pass.end();

    encoder.copyTextureToTexture(
      {
        texture: sourceGPU,
        origin: { x: 0, y: 0, z: 0 },
      },
      {
        texture: destinationGPU,
      },
      [into.image.width, into.image.height],
    );

    if (into.generateMipmaps) this.hearth.textures.generateMipmaps(into);

    descriptor.colorAttachments[0].loadOp = GPULoadOpType.Load;
    if (context.useDepth) descriptor.depthStencilAttachment.depthLoadOp = GPULoadOpType.Load;
    if (context.useStencil) descriptor.depthStencilAttachment.stencilLoadOp = GPULoadOpType.Load;

    data.pass = encoder.beginRenderPass(descriptor);
    data.sets = { attributes: {} };
  }

  #source(value: Texture) {
    const context = this.hearth.context;

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
