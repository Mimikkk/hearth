import { CompressedTextureFormat, Mapping, TextureDataType } from '../constants.js';
import { CompressedTexture } from './CompressedTexture.js';

export class CompressedCubeTexture extends CompressedTexture {
  declare isCubeTexture: true;

  constructor(images: ImageData[], format: CompressedTextureFormat, type: TextureDataType) {
    super(images, images[0].width, images[0].height, {
      format,
      type,
      mapping: Mapping.CubeReflection,
    });
  }
}

CompressedCubeTexture.prototype.isCubeTexture = true;
