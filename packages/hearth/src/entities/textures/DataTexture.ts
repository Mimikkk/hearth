import { Texture, TextureParameters } from './Texture.js';
import { GPUFilterModeType } from '../../hearth/constants.js';

export class DataTexture extends Texture {
  declare isDataTexture: true;

  constructor({ data = null, width = 1, height = 1, ...params }: DataTextureParameters) {
    super({
      image: { data, width, height },
      magFilter: GPUFilterModeType.Nearest,
      minFilter: GPUFilterModeType.Nearest,
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
