import { CubeImages, CubeTexture } from '../textures/CubeTexture.js';
import { RenderTarget } from './RenderTarget.js';
import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';

export class CubeRenderTarget extends RenderTarget {
  constructor(size: number = 1, options?: RenderTarget.Options) {
    super(size, size, options);

    const image = { width: size, height: size, depth: 1 };
    const images = [image, image, image, image, image, image] as CubeImages;

    this.texture = new CubeTexture(images, this.configuration);

    this.texture.isRenderTargetTexture = true;
    this.texture.generateMipmaps = this.configuration.generateMipmaps;
    this.texture.minFilter = this.configuration.minFilter;
  }

  clear(renderer: Renderer, color: boolean, depth: boolean, stencil: boolean): void {
    const target = renderer.target;

    renderer.setRenderTarget(this, 0);
    renderer.clear(color, depth, stencil);
    renderer.setRenderTarget(this, 1);
    renderer.clear(color, depth, stencil);
    renderer.setRenderTarget(this, 2);
    renderer.clear(color, depth, stencil);
    renderer.setRenderTarget(this, 3);
    renderer.clear(color, depth, stencil);
    renderer.setRenderTarget(this, 4);
    renderer.clear(color, depth, stencil);
    renderer.setRenderTarget(this, 5);
    renderer.clear(color, depth, stencil);

    renderer.setRenderTarget(target);
  }
}
