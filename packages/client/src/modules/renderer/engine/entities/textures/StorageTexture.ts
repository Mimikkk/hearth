import { Texture, TextureParameters } from '@modules/renderer/engine/entities/textures/Texture.js';
import { MagnificationTextureFilter, MinificationTextureFilter } from '@modules/renderer/engine/constants.js';

export class StorageTexture extends Texture<{ width: number, height: number }> {
  declare isStorageTexture: true;

  constructor(parameters: StorageTextureParameters) {
    super({
      magFilter: MagnificationTextureFilter.Linear,
      minFilter: MinificationTextureFilter.Linear,
      ...parameters,
      image: { width: parameters.width, height: parameters.height },
    });
  }
}

StorageTexture.prototype.isStorageTexture = true;

export type StorageTextureParameters = Omit<TextureParameters, 'image'> & { width: number; height: number };
