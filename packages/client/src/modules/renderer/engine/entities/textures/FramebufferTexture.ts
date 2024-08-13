import { Texture, TextureParameters } from './Texture.js';
import { GPUFilterModeType } from '@modules/renderer/engine/hearth/constants.js';

export class FramebufferTexture extends Texture<{ width: number; height: number }> {
  declare isFramebufferTexture: true;

  constructor(parameters: FramebufferTextureParameters) {
    super({
      ...parameters,
      image: { width: parameters.width, height: parameters.height },
      magFilter: GPUFilterModeType.Nearest,
      minFilter: GPUFilterModeType.Nearest,
      useMipmap: false,
      useUpdate: true,
    });
  }
}

FramebufferTexture.prototype.isFramebufferTexture = true;

export type FramebufferTextureParameters = Omit<TextureParameters, 'image'> & { width: number; height: number };
