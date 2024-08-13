import { Texture, TextureParameters } from './Texture.js';
import { GPUAddressModeType, GPUFilterModeType } from '@modules/renderer/engine/hearth/constants.js';

export class Data3DTexture extends Texture {
  declare isData3DTexture: true;
  wrapR: GPUAddressModeType;

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
    this.wrapR = parameters?.wrapR ?? GPUAddressModeType.ClampToEdge;
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
  wrapR?: GPUAddressModeType;
}
