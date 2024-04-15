import { Texture } from './Texture.js';
import { Filter, TextureDataType, TextureFormat } from '../constants.ts';

class DepthTexture extends Texture {
  constructor(width, height, type, mapping, wrapS, wrapT, magFilter, minFilter, anisotropy, format) {
    format = format !== undefined ? format : TextureFormat.Depth;

    if (format !== TextureFormat.Depth && format !== TextureFormat.DepthStencil) {
      throw new Error(
        'DepthTexture format must be either THREE.TextureFormat.Depth or THREE.TextureFormat.DepthStencil',
      );
    }

    if (type === undefined && format === TextureFormat.Depth) type = TextureDataType.UnsignedInt;
    if (type === undefined && format === TextureFormat.DepthStencil) type = TextureDataType.UnsignedInt248;

    super(null, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy);

    this.isDepthTexture = true;

    this.image = { width: width, height: height };

    this.magFilter = magFilter !== undefined ? magFilter : Filter.Nearest;
    this.minFilter = minFilter !== undefined ? minFilter : Filter.Nearest;

    this.flipY = false;
    this.generateMipmaps = false;

    this.compareFunction = null;
  }

  copy(source) {
    super.copy(source);

    this.compareFunction = source.compareFunction;

    return this;
  }

  toJSON(meta) {
    const data = super.toJSON(meta);

    if (this.compareFunction !== null) data.compareFunction = this.compareFunction;

    return data;
  }
}

export { DepthTexture };
