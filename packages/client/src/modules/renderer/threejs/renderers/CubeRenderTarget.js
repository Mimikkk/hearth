import { Filter } from '../constants.ts';
import { CubeTexture } from '../textures/CubeTexture.ts';
import { RenderTarget } from '../core/RenderTarget.ts';

export class CubeRenderTarget extends RenderTarget {
  constructor(size = 1, options = {}) {
    super(size, size, options);

    const image = { width: size, height: size, depth: 1 };
    const images = [image, image, image, image, image, image];

    this.texture = new CubeTexture(
      images,
      options.mapping,
      options.wrapS,
      options.wrapT,
      options.magFilter,
      options.minFilter,
      options.format,
      options.type,
      options.anisotropy,
      options.colorSpace,
    );

    this.texture.isRenderTargetTexture = true;

    this.texture.generateMipmaps = options.generateMipmaps !== undefined ? options.generateMipmaps : false;
    this.texture.minFilter = options.minFilter !== undefined ? options.minFilter : Filter.Linear;
  }

  clear(renderer, color, depth, stencil) {
    const currentRenderTarget = renderer.getRenderTarget();

    for (let i = 0; i < 6; i++) {
      renderer.setRenderTarget(this, i);

      renderer.clear(color, depth, stencil);
    }

    renderer.setRenderTarget(currentRenderTarget);
  }
}
