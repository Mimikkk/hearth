import { Texture } from './Texture.js';

export class CanvasTexture extends Texture<TexImageSource> {
  declare isCanvasTexture: true;

  constructor(image: TexImageSource, options?: Texture.Options) {
    super(image, options);
    this.version = 1;
  }

  static is(item: any): item is CanvasTexture {
    return item?.isCanvasTexture === true;
  }
}

CanvasTexture.prototype.isCanvasTexture = true;
