import { Wrapping } from '../constants.ts';
import { CompressedTexture } from './CompressedTexture.js';

class CompressedArrayTexture extends CompressedTexture {
  constructor(mipmaps, width, height, depth, format, type) {
    super(mipmaps, width, height, format, type);

    this.isCompressedArrayTexture = true;
    this.image.depth = depth;
    this.wrapR = Wrapping.ClampToEdge;
  }
}

export { CompressedArrayTexture };
