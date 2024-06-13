import { Texture } from './Texture.js';
import { MagnificationTextureFilter, MinificationTextureFilter, Wrapping } from '../constants.js';

export class DataArrayTexture extends Texture {
  declare isDataArrayTexture: true;
  wrapR: Wrapping;

  constructor(data: BufferSource | null = null, width: number = 1, height: number = 1, depth: number = 1) {
    super(null as never);

    this.image = { data, width, height, depth };

    this.magFilter = MagnificationTextureFilter.Nearest;
    this.minFilter = MinificationTextureFilter.Nearest;
    this.wrapR = Wrapping.ClampToEdge;

    this.generateMipmaps = false;
    this.flipY = false;
    this.unpackAlignment = 1;
  }
}
DataArrayTexture.prototype.isDataArrayTexture = true;
