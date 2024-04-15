import { Texture } from './Texture.js';
import { Filter, Wrapping } from '../constants.ts';

class DataArrayTexture extends Texture {
  constructor(data = null, width = 1, height = 1, depth = 1) {
    super(null);

    this.isDataArrayTexture = true;

    this.image = { data, width, height, depth };

    this.magFilter = Filter.Nearest;
    this.minFilter = Filter.Nearest;

    this.wrapR = Wrapping.ClampToEdge;

    this.generateMipmaps = false;
    this.flipY = false;
    this.unpackAlignment = 1;
  }
}

export { DataArrayTexture };
