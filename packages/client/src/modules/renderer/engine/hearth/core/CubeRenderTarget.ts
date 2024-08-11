import { CubeTexture } from '@modules/renderer/engine/entities/textures/CubeTexture.js';
import { RenderTarget } from './RenderTarget.js';
import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';

export class CubeRenderTarget extends RenderTarget {
  constructor(size = 1, options?: RenderTarget.Options) {
    super(size, size, options);

    const image = { width: size, height: size, depth: 1 };
    const images = [image, image, image, image, image, image];

    this.texture = new CubeTexture({
      ...this.configuration,
      images,
      isRenderTargetTexture: true,
    });
  }

  clear(hearth: Hearth, color: boolean, depth: boolean, stencil: boolean): void {
    const currentRenderTarget = hearth.target;

    for (let i = 0; i < 6; i++) {
      hearth.updateRenderTarget(this, i);

      hearth.clear(color, depth, stencil);
    }

    hearth.updateRenderTarget(currentRenderTarget);
  }
}
