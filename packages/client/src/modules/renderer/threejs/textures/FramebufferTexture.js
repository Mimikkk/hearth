import { Texture } from './Texture.js';
import { Filter } from '../constants.ts';

class FramebufferTexture extends Texture {
  constructor(width, height) {
    super({ width, height });

    this.isFramebufferTexture = true;

    this.magFilter = Filter.Nearest;
    this.minFilter = Filter.Nearest;

    this.generateMipmaps = false;

    this.needsUpdate = true;
  }
}

export { FramebufferTexture };
