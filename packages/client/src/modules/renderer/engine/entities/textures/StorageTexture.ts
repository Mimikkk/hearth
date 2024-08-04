import { MagnificationTextureFilter, MinificationTextureFilter, Texture } from '@modules/renderer/engine/engine.js';

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
