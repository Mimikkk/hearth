import { Texture } from './Texture.js';
import { MagnificationTextureFilter, MinificationTextureFilter } from '../constants.js';

type DataSource = { data: BufferSource | null; width: number; height: number };

export class DataTexture extends Texture<DataSource> {
  declare isDataTexture: true;

  constructor(data: BufferSource | null = null, width = 1, height = 1, options?: Texture.Options) {
    super(
      { data, width, height },
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

export namespace DataTexture {
  export type Options = Omit<Texture.Options, 'generateMipmaps' | 'flipY' | 'unpackAlignment'>;
}

DataTexture.prototype.isDataTexture = true;
