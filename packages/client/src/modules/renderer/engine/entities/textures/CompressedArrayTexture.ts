import { CompressedPixelFormat, TextureDataType } from '../../constants.js';
import { CompressedTexture } from './CompressedTexture.js';
import { GPUAddressModeType } from '@modules/renderer/engine/hearth/constants.js';

export class CompressedArrayTexture extends CompressedTexture {
  wrapR: GPUAddressModeType;

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
    this.wrapR = GPUAddressModeType.ClampToEdge;
  }
}
