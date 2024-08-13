import { Texture, TextureParameters } from './Texture.js';
import { Wrapping } from '../../constants.js';
import { GPUFilterModeType } from '@modules/renderer/engine/hearth/constants.js';

export class Data3DTexture extends Texture {
  declare isData3DTexture: true;
  wrapR: Wrapping;

  constructor({ data, width, height, depth, ...parameters }: Data3DTextureParameters) {
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

  static is(value: any): value is Data3DTexture {
    return value?.isData3DTexture === true;
  }
}

Data3DTexture.prototype.isData3DTexture = true;

export interface Data3DTextureParameters extends Omit<TextureParameters, 'image'> {
  data: BufferSource | null;
  width: number;
  height: number;
  depth: number;
  wrapR?: Wrapping;
}
