import { Texture } from './Texture.js';

export class CanvasTexture extends Texture<TexImageSource> {
  constructor(image: TexImageSource, options?: Texture.Options) {
    super(image, options);
    this.version = 1;
  }
}
