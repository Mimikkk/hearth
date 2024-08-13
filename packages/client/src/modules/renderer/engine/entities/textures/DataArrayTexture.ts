import { Texture, TextureParameters } from './Texture.js';
import { Wrapping } from '../../constants.js';
import { GPUFilterModeType } from '@modules/renderer/engine/hearth/constants.js';

export class DataArrayTexture extends Texture {
  declare isDataArrayTexture: true;
  wrapR: Wrapping;

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

    this.wrapR = parameters?.wrapR ?? Wrapping.ClampToEdge;
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
  wrapR?: Wrapping;
}
