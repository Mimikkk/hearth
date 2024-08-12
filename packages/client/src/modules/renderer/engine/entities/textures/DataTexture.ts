import { Texture, TextureParameters } from './Texture.js';
import { MagnificationTextureFilter, MinificationTextureFilter } from '../../constants.js';

export class DataTexture extends Texture {
  declare isDataTexture: true;

  constructor({ data = null, width = 1, height = 1, ...params }: DataTextureParameters) {
    super({
      image: { data, width, height },
      magFilter: MagnificationTextureFilter.Nearest,
      minFilter: MinificationTextureFilter.Nearest,
      useMipmap: false,
      flipY: false,
      unpackAlignment: 1,
      ...params,
    });
  }

  static is(value: any): value is DataTexture {
    return value?.isDataTexture === true;
  }
}

DataTexture.prototype.isDataTexture = true;

export interface DataTextureParameters extends Omit<TextureParameters, 'image'> {
  data?: BufferSource | null;
  width?: number;
  height?: number;
}
