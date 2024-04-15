import { Mapping } from '../constants.ts';
import { CompressedTexture } from './CompressedTexture.js';

class CompressedCubeTexture extends CompressedTexture {
  constructor(images, format, type) {
    super(undefined, images[0].width, images[0].height, format, type, Mapping.CubeReflection);

    this.isCompressedCubeTexture = true;
    this.isCubeTexture = true;

    this.image = images;
  }
}

export { CompressedCubeTexture };
