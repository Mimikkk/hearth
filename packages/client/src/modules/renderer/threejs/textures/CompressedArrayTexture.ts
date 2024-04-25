import { CompressedPixelFormat, TextureDataType, Wrapping } from '../constants.js';
import { CompressedTexture } from './CompressedTexture.js';

export class CompressedArrayTexture extends CompressedTexture {
  declare isCompressedArrayTexture: boolean;
  wrapR: Wrapping;

  constructor(
    mipmaps: ImageData[],
    width: number,
    height: number,
    depth: number,
    format: CompressedPixelFormat,
    type: TextureDataType,
  ) {
    super(mipmaps, width, height, format, type);

    this.image.depth = depth;
    this.wrapR = Wrapping.ClampToEdge;
  }
}
CompressedArrayTexture.prototype.isCompressedArrayTexture = true;
