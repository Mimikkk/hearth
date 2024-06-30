import { Texture } from './Texture.js';

export class CanvasTexture extends Texture<TexImageSource> {
  constructor(canvas: TexImageSource, options?: Texture.Options) {
    super(canvas, options);
    this.needsUpdate = true;
  }
}
