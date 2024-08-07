import { Texture } from '@modules/renderer/engine/entities/textures/Texture.js';
import { MagnificationTextureFilter, MinificationTextureFilter } from '@modules/renderer/engine/constants.js';

export class StorageTexture extends Texture {
  declare isStorageTexture: true;
  magFilter: MagnificationTextureFilter;
  minFilter: MinificationTextureFilter;

  constructor(width: number = 1, height: number = 1) {
    //@ts-expect-error
    super();

    this.image = { width, height };

    this.magFilter = MagnificationTextureFilter.Linear;
    this.minFilter = MinificationTextureFilter.Linear;
    this.isStorageTexture = true;
  }
}
