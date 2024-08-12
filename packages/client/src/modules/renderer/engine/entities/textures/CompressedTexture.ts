import { Texture } from './Texture.js';
import {
  ColorSpace,
  CompressedPixelFormat,
  MagnificationTextureFilter,
  Mapping,
  MinificationTextureFilter,
  TextureDataType,
  TextureFormat,
  Wrapping,
} from '../../constants.js';

export class CompressedTexture extends Texture {
  declare isCompressedTexture: true;

  constructor(
    mipmaps: ImageData[],
    width: number,
    height: number,
    format: CompressedPixelFormat,
    type?: TextureDataType,
    mapping?: Mapping,
    wrapS?: Wrapping,
    wrapT?: Wrapping,
    magFilter?: MagnificationTextureFilter,
    minFilter?: MinificationTextureFilter,
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
}

CompressedTexture.prototype.isCompressedTexture = true;
