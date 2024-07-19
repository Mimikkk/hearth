import { Texture } from './Texture.js';
import { CubeMapping } from '../constants.js';

export type CubeImage = TexImageSource[] | { width: number; height: number; depth: number };
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

  static is(item: any): item is CubeTexture {
    return item?.isCubeTexture === true;
  }
}

CubeTexture.prototype.isCubeTexture = true;
