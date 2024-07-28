import { Texture } from './Texture.js';
import {
  ColorSpace,
  MagnificationTextureFilter,
  Mapping,
  MinificationTextureFilter,
  TextureDataType,
  TextureFormat,
  Wrapping,
} from '../../constants.js';

export class DataTexture extends Texture {
  declare isDataTexture: true;

  constructor(
    data: BufferSource | null = null,
    width = 1,
    height = 1,
    format: TextureFormat,
    type: TextureDataType,
    mapping: Mapping,
    wrapS: Wrapping,
    wrapT: Wrapping,
    magFilter = MagnificationTextureFilter.Nearest,
    minFilter = MinificationTextureFilter.Nearest,
    anisotropy: number,
    colorSpace: ColorSpace,
  ) {
    super(null as never, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy, colorSpace);

    this.image = { data: data, width: width, height: height };

    this.generateMipmaps = false;
    this.flipY = false;
    this.unpackAlignment = 1;
  }
}

DataTexture.prototype.isDataTexture = true;
