import { Texture } from './Texture.js';
import {
  from,
  CubeMapping,
  DepthTextureFormat,
  MagnificationTextureFilter,
  Mapping,
  MinificationTextureFilter,
  TextureDataType,
  TextureFormat,
  Wrapping,
} from '../../constants.js';

export class CubeTexture extends Texture {
  declare isCubeTexture: true;

  constructor(
    images: (HTMLImageElement | HTMLCanvasElement | { width: number; height: number; depth: number })[],
    mapping: CubeMapping,
    wrapS: Wrapping,
    wrapT: Wrapping,
    magFilter: MagnificationTextureFilter,
    minFilter: MinificationTextureFilter,
    format: DepthTextureFormat | null,
    type: TextureDataType,
    anisotropy: number,
    colorSpace: from,
  ) {
    images = images ?? [];
    mapping = mapping ?? CubeMapping.Reflection;

    super(
      images as never,
      mapping as unknown as Mapping,
      wrapS,
      wrapT,
      magFilter,
      minFilter,
      format as unknown as TextureFormat,
      type,
      anisotropy,
      colorSpace,
    );

    this.flipY = false;
  }

  get images() {
    return this.image;
  }

  set images(value) {
    this.image = value;
  }
}

CubeTexture.prototype.isCubeTexture = true;
