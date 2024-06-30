import { Texture } from './Texture.js';
import { CubeMapping } from '../constants.js';

export type CubeImage = TexImageSource[];
export type CubeImages = [
  posX: CubeImage,
  negX: CubeImage,
  posY: CubeImage,
  negY: CubeImage,
  posZ: CubeImage,
  negZ: CubeImage,
];

export class CubeTexture extends Texture<CubeImages> {
  declare isCubeTexture: true;

  constructor(images: CubeImages, options?: Texture.Options) {
    super(images, { flipY: false, mapping: CubeMapping.Reflection, ...options });
  }
}

CubeTexture.prototype.isCubeTexture = true;
