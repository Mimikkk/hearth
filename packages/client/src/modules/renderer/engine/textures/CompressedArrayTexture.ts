import { CompressedTexture } from './CompressedTexture.js';
import { Texture } from '@modules/renderer/engine/textures/Texture.js';

type ArrayImage = { mipmaps: ImageData[]; width: number; height: number; depth: number };

export class CompressedArrayTexture extends CompressedTexture {
  constructor(image: ArrayImage, options?: Texture.Options) {
    super(image, options);
  }
}
