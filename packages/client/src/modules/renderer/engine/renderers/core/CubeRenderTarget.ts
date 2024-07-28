import { CubeTexture } from '@modules/renderer/engine/objects/textures/CubeTexture.js';
import { RenderTarget } from '../RenderTarget.js';
import { Forge } from '@modules/renderer/engine/renderers/Forge.js';
import { CubeMapping, DepthTextureFormat } from '@modules/renderer/engine/constants.js';

export class CubeRenderTarget extends RenderTarget {
  constructor(size = 1, options?: RenderTarget.Options) {
    super(size, size, options);

    const image = { width: size, height: size, depth: 1 };
    const images = [image, image, image, image, image, image];

    const { mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy, colorSpace } = this.configuration;
    this.texture = new CubeTexture(
      images,
      mapping as never as CubeMapping,
      wrapS,
      wrapT,
      magFilter,
      minFilter,
      format as never as DepthTextureFormat,
      type,
      anisotropy,
      colorSpace,
    );

    this.texture.isRenderTargetTexture = true;
    this.texture.generateMipmaps = this.configuration.generateMipmaps;
    this.texture.minFilter = minFilter;
  }

  clear(renderer: Forge, color: boolean, depth: boolean, stencil: boolean): void {
    const currentRenderTarget = renderer.target;

    for (let i = 0; i < 6; i++) {
      renderer.updateRenderTarget(this, i);

      renderer.clear(color, depth, stencil);
    }

    renderer.updateRenderTarget(currentRenderTarget);
  }
}
