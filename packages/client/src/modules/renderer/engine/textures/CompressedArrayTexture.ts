import { CompressedTextureFormat, TextureDataType, Wrapping } from '../constants.js';
import { CompressedTexture } from './CompressedTexture.js';

export class CompressedArrayTexture extends CompressedTexture {
  wrapR: Wrapping;

  constructor(
    images: ImageData[],
    width: number,
    height: number,
    depth: number,
    format: CompressedTextureFormat,
    type: TextureDataType,
  ) {
    super(images, width, height, { format, type });

    this.image.depth = depth;
    this.wrapR = Wrapping.ClampToEdge;
  }
}
