import { CompressedTexture } from './CompressedTexture.js';
import { Texture } from '@modules/renderer/engine/textures/Texture.js';

type ArrayImage = { mipmaps: ImageData[]; width: number; height: number; depth: number };

export class CompressedArrayTexture extends CompressedTexture {
  declare isCompressedArrayTexture: true;

  constructor(image: ArrayImage, options?: Texture.Options) {
    super(image, options);
  }

  static is(item: any): item is CompressedArrayTexture {
    return item?.isCompressedArrayTexture === true;
  }
}

CompressedArrayTexture.prototype.isCompressedArrayTexture = true;
