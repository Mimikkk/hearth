import { Texture } from './Texture.js';
import { MagnificationTextureFilter, MinificationTextureFilter } from '../constants.js';

export class FramebufferTexture extends Texture {
  declare isFramebufferTexture: true;

  constructor(width: number, height: number) {
    super(
      { width, height },
      {
        magFilter: MagnificationTextureFilter.Nearest,
        minFilter: MinificationTextureFilter.Nearest,
        generateMipmaps: false,
        version: 1,
      },
    );
  }

  static is(item: any): item is FramebufferTexture {
    return item?.isFramebufferTexture;
  }
}

FramebufferTexture.prototype.isFramebufferTexture = true;
