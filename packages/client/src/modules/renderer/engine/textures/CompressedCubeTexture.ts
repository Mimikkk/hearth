import { CompressedTextureFormat, Mapping, TextureDataType } from '../constants.js';
import { CompressedTexture } from './CompressedTexture.js';

export class CompressedCubeTexture extends CompressedTexture {
  declare isCubeTexture: true;

  constructor(images: { width: number; height: number }[], format: CompressedTextureFormat, type: TextureDataType) {
    super(undefined as never, images[0].width, images[0].height, format, type, Mapping.CubeReflection);

    this.image = images;
  }
}
CompressedCubeTexture.prototype.isCubeTexture = true;
