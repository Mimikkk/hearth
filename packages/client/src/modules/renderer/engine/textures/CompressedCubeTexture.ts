import { CubeMapping } from '../constants.js';
import { CompressedTexture } from './CompressedTexture.js';
import { Texture } from '@modules/renderer/engine/textures/Texture.js';

type CubeImage = ImageData[];

export class CompressedCubeTexture extends CompressedTexture {
  declare isCubeTexture: true;

  constructor(mipmaps: CubeImage, options?: Texture.Options) {
    super(
      { mipmaps, width: mipmaps[0].width, height: mipmaps[0].height },
      {
        mapping: CubeMapping.Reflection,
        ...options,
      },
    );
  }
}

CompressedCubeTexture.prototype.isCubeTexture = true;
