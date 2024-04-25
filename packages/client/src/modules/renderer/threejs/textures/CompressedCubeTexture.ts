import { CompressedPixelFormat, Mapping, TextureDataType } from '../constants.js';
import { CompressedTexture } from './CompressedTexture.js';

export class CompressedCubeTexture extends CompressedTexture {
  declare isCompressedCubeTexture: true;
  declare isCubeTexture: true;

  constructor(images: { width: number; height: number }[], format: CompressedPixelFormat, type: TextureDataType) {
    super(undefined as never, images[0].width, images[0].height, format, type, Mapping.CubeReflection);

    this.image = images;
  }
}
CompressedCubeTexture.prototype.isCompressedCubeTexture = true;
CompressedCubeTexture.prototype.isCubeTexture = true;
