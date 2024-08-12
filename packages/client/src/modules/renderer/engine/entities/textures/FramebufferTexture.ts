import { Texture, TextureParameters } from './Texture.js';
import { MagnificationTextureFilter, MinificationTextureFilter } from '../../constants.js';

export class FramebufferTexture extends Texture<{ width: number; height: number }> {
  declare isFramebufferTexture: true;

  constructor(parameters: FramebufferTextureParameters) {
    super({
      ...parameters,
      image: { width: parameters.width, height: parameters.height },
      magFilter: MagnificationTextureFilter.Nearest,
      minFilter: MinificationTextureFilter.Nearest,
      useMipmap: false,
      useUpdate: true,
    });
  }
}

FramebufferTexture.prototype.isFramebufferTexture = true;

export type FramebufferTextureParameters = Omit<TextureParameters, 'image'> & { width: number; height: number };
