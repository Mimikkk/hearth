import { Texture } from './Texture.js';

type CompressedImage = { width: number; height: number; depth?: number };

export class CompressedTexture extends Texture<CompressedImage> {
  declare isCompressedTexture: true;

  constructor(
    {
      width,
      height,
      mipmaps,
    }: {
      mipmaps: ImageData[];
      width: number;
      height: number;
      depth?: number;
    },
    options?: Texture.Options,
  ) {
    super({ width, height }, { mipmaps, flipY: false, generateMipmaps: false, ...options });
  }

  static is(item: any): item is CompressedTexture {
    return item?.isCompressedTexture === true;
  }
}

CompressedTexture.prototype.isCompressedTexture = true;
