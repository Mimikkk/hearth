import { Texture } from './Texture.js';
import { ColorSpace, CompressedPixelFormat, Mapping, TextureDataType, TextureFormat } from '../../constants.js';
import { GPUAddressModeType, GPUFilterModeType } from '../../hearth/constants.js';

export class CompressedTexture extends Texture {
  declare isCompressedTexture: true;

  constructor(
    mipmaps: ImageData[],
    width: number,
    height: number,
    format: CompressedPixelFormat,
    type?: TextureDataType,
    mapping?: Mapping,
    wrapS?: GPUAddressModeType,
    wrapT?: GPUAddressModeType,
    magFilter?: GPUFilterModeType,
    minFilter?: GPUFilterModeType,
    anisotropy?: number,
    colorSpace?: ColorSpace,
  ) {
    super(
      null as never,
      mapping,
      wrapS,
      wrapT,
      magFilter,
      minFilter,
      format as unknown as TextureFormat,
      type,
      anisotropy,
      colorSpace,
    );

    this.image = { width: width, height: height };
    this.mipmaps = mipmaps;

    this.flipY = false;

    this.useMipmap = false;
  }

  static is(value: any): value is CompressedTexture {
    return value?.isCompressedTexture === true;
  }
}

CompressedTexture.prototype.isCompressedTexture = true;
