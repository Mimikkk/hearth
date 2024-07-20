import { Texture } from './Texture.js';

type CompressedImage = { width: number; height: number; depth?: number };

export class CompressedTexture extends Texture<CompressedImage> {
  declare isCompressedTexture: true;

  constructor(mipmaps: ImageData[], width: number, height: number, options?: Texture.Options) {
    super({ width, height }, { ...options, mipmaps, flipY: false, generateMipmaps: false });
  }
}

CompressedTexture.prototype.isCompressedTexture = true;
