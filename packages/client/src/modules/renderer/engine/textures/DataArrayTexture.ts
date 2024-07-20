import { Texture } from './Texture.js';
import { MagnificationTextureFilter, MinificationTextureFilter, Wrapping } from '../constants.js';

type DataArraySource = { data: BufferSource | null; width: number; height: number; depth: number };

export class DataArrayTexture extends Texture<DataArraySource> {
  declare isDataArrayTexture: true;
  wrapR: Wrapping;

  constructor(data: BufferSource | null = null, width: number = 1, height: number = 1, depth: number = 1) {
    super(
      { data, width, height, depth },
      {
        magFilter: MagnificationTextureFilter.Nearest,
        minFilter: MinificationTextureFilter.Nearest,
        generateMipmaps: false,
        flipY: false,
        unpackAlignment: 1,
      },
    );

    this.wrapR = Wrapping.ClampToEdge;
  }
}

DataArrayTexture.prototype.isDataArrayTexture = true;
