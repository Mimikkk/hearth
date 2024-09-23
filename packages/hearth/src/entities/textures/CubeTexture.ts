import { Texture, TextureParameters } from './Texture.js';
import { CubeMapping, DepthTextureFormat } from '../../constants.js';

export class CubeTexture extends Texture {
  declare isCubeTexture: true;

  constructor(parameters: CubeTextureParameters) {
    super({
      ...parameters,
      mapping: parameters.mapping ?? CubeMapping.Reflection,
      image: parameters.images ?? [],
      flipY: false,
    });
  }

  static is(value: any): value is CubeTexture {
    return value?.isCubeTexture === true;
  }

  get images() {
    return this.image as (HTMLImageElement | HTMLCanvasElement | { width: number; height: number; depth: number })[];
  }

  set images(value) {
    this.image = value;
  }
}

CubeTexture.prototype.isCubeTexture = true;

export interface CubeTextureParameters extends Omit<TextureParameters, 'image' | 'mapping' | 'format'> {
  images?: (HTMLImageElement | HTMLCanvasElement | { width: number; height: number; depth: number })[];
  mapping?: CubeMapping;
  format?: DepthTextureFormat | null;
}
