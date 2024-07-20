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
}

FramebufferTexture.prototype.isFramebufferTexture = true;
