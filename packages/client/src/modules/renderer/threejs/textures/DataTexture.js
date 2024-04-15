import { Texture } from './Texture.js';
import { Filter } from '../constants.ts';

class DataTexture extends Texture {
  constructor(
    data = null,
    width = 1,
    height = 1,
    format,
    type,
    mapping,
    wrapS,
    wrapT,
    magFilter = Filter.Nearest,
    minFilter = Filter.Nearest,
    anisotropy,
    colorSpace,
  ) {
    super(null, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy, colorSpace);

    this.isDataTexture = true;

    this.image = { data: data, width: width, height: height };

    this.generateMipmaps = false;
    this.flipY = false;
    this.unpackAlignment = 1;
  }
}

export { DataTexture };
