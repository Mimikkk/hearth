import { Texture } from './Texture.js';
import { MagnificationTextureFilter, MinificationTextureFilter } from '../constants.js';

type DataArraySource = { data: BufferSource | null; width: number; height: number; depth: number };

export class DataArrayTexture extends Texture<DataArraySource> {
  declare isDataArrayTexture: true;

  constructor(
    data: BufferSource | null = null,
    width: number = 1,
    height: number = 1,
    depth: number = 1,
    options?: Texture.Options,
  ) {
    super(
      { data, width, height, depth },
      {
        magFilter: MagnificationTextureFilter.Nearest,
        minFilter: MinificationTextureFilter.Nearest,
        generateMipmaps: false,
        flipY: false,
        unpackAlignment: 1,
        ...options,
      },
    );
  }
}

DataArrayTexture.prototype.isDataArrayTexture = true;
