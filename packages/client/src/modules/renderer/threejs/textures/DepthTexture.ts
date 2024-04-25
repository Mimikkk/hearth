import { Texture } from './Texture.js';
import {
  DepthComparison,
  MagnificationTextureFilter,
  Mapping,
  MinificationTextureFilter,
  TextureDataType,
  TextureFormat,
  Wrapping,
} from '../constants.js';

export class DepthTexture extends Texture {
  //@ts-expect-error
  declare ['constructor']: typeof DepthTexture;
  declare isDepthTexture: true;
  compareFunction: DepthComparison | null;

  constructor(
    width: number,
    height: number,
    type: TextureDataType,
    mapping: Mapping,
    wrapS: Wrapping,
    wrapT: Wrapping,
    magFilter: MagnificationTextureFilter,
    minFilter: MinificationTextureFilter,
    anisotropy: number,
    format: TextureFormat,
  ) {
    format = format !== undefined ? format : TextureFormat.Depth;

    if (format !== TextureFormat.Depth && format !== TextureFormat.DepthStencil) {
      throw new Error(
        'DepthTexture format must be either THREE.TextureFormat.Depth or THREE.TextureFormat.DepthStencil',
      );
    }

    if (type === undefined && format === TextureFormat.Depth) type = TextureDataType.UnsignedInt;
    if (type === undefined && format === TextureFormat.DepthStencil) type = TextureDataType.UnsignedInt248;

    super(null as never, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy);

    this.image = { width: width, height: height };

    this.magFilter = magFilter ?? MagnificationTextureFilter.Nearest;
    this.minFilter = minFilter ?? MinificationTextureFilter.Nearest;

    this.flipY = false;
    this.generateMipmaps = false;

    this.compareFunction = null;
  }

  //@ts-expect-error
  copy(source: DepthTexture): this {
    super.copy(source as unknown as Texture);

    this.compareFunction = source.compareFunction;

    return this;
  }

  toJSON(meta: any): any {
    const data = super.toJSON(meta);

    if (this.compareFunction !== null) data.compareFunction = this.compareFunction;

    return data;
  }
}
DepthTexture.prototype.isDepthTexture = true;
