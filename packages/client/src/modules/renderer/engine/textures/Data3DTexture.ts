import { Texture } from './Texture.js';
import { MagnificationTextureFilter, MinificationTextureFilter, Wrapping } from '../constants.js';

type Data3DImage = { data: BufferSource | null; width: number; height: number; depth: number };

export class Data3DTexture extends Texture<Data3DImage> {
  declare isData3DTexture: true;
  wrapR: Wrapping;

  constructor(
    data: BufferSource | null = null,
    width: number = 1,
    height: number = 1,
    depth: number = 1,
    options?: Texture.Options,
  ) {
    super(
      { data, width, height, depth },
      {
        flipY: false,
        generateMipmaps: false,
        unpackAlignment: 1,
        magFilter: MagnificationTextureFilter.Nearest,
        minFilter: MinificationTextureFilter.Nearest,
        ...options,
      },
    );

    this.wrapR = Wrapping.ClampToEdge;
  }
}

Data3DTexture.prototype.isData3DTexture = true;
