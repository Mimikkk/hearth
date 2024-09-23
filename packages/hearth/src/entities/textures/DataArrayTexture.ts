import { Texture, TextureParameters } from './Texture.js';
import { GPUAddressModeType, GPUFilterModeType } from '../../hearth/constants.js';

export class DataArrayTexture extends Texture {
  declare isDataArrayTexture: true;
  wrapR: GPUAddressModeType;

  constructor({ data, width, height, depth, ...parameters }: DataArrayTextureParameters) {
    super({
      image: { data, width, height, depth },
      magFilter: GPUFilterModeType.Nearest,
      minFilter: GPUFilterModeType.Nearest,
      useMipmap: false,
      flipY: false,
      unpackAlignment: 1,
      ...parameters,
    });

    this.wrapR = parameters?.wrapR ?? GPUAddressModeType.ClampToEdge;
  }

  static is(value: any): value is DataArrayTexture {
    return value?.isDataArrayTexture === true;
  }
}

DataArrayTexture.prototype.isDataArrayTexture = true;

export interface DataArrayTextureParameters extends Omit<TextureParameters, 'image'> {
  data: BufferSource | null;
  width: number;
  height: number;
  depth: number;
  wrapR?: GPUAddressModeType;
}
