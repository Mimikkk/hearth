import { Texture } from './Texture.js';
import { MagnificationTextureFilter, MinificationTextureFilter } from '../constants.js';

export class FramebufferTexture extends Texture {
  declare isFramebufferTexture: true;

  constructor(width: number, height: number) {
    super({ width, height } as TexImageSource);

    this.magFilter = MagnificationTextureFilter.Nearest;
    this.minFilter = MinificationTextureFilter.Nearest;

    this.generateMipmaps = false;

    this.needsUpdate = true;
  }
}
FramebufferTexture.prototype.isFramebufferTexture = true;
