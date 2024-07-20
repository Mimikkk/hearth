import { Texture } from './Texture.js';
import {
  DepthComparison,
  MagnificationTextureFilter,
  MinificationTextureFilter,
  TextureDataType,
  TextureFormat,
} from '../constants.js';

export class DepthTexture extends Texture {
  declare isDepthTexture: true;
  compareFunction: DepthComparison | null;

  constructor(width?: number, height?: number, options?: Options) {
    super(
      { width, height },
      {
        magFilter: MagnificationTextureFilter.Nearest,
        minFilter: MinificationTextureFilter.Nearest,
        type:
          options?.format === TextureFormat.DepthStencil ? TextureDataType.UnsignedInt248 : TextureDataType.UnsignedInt,
        flipY: false,
        generateMipmaps: false,
        ...options,
      },
    );

    this.compareFunction = options?.compareFunction ?? null;
  }

  copy(source: this): this {
    super.copy(source);
    this.compareFunction = source.compareFunction;
    return this;
  }
}

export namespace DepthTexture {
  export type Options = Omit<Texture.Options, 'format'> & {
    format?: TextureFormat.Depth | TextureFormat.DepthStencil;
    compareFunction?: DepthComparison;
  };
}
type Options = DepthTexture.Options;

DepthTexture.prototype.isDepthTexture = true;
