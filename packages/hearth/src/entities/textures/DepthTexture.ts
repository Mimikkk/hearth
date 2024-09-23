import { Texture, TextureParameters } from './Texture.js';
import { TextureDataType, TextureFormat } from '../../constants.js';
import { GPUCompareFunctionType, GPUFilterModeType } from '../../hearth/constants.js';

export class DepthTexture extends Texture {
  declare isDepthTexture: true;
  compare?: GPUCompareFunctionType;

  constructor({
    width,
    height,
    format = TextureFormat.Depth,
    type = format === TextureFormat.Depth ? TextureDataType.UnsignedInt : TextureDataType.UnsignedInt248,
    magFilter = GPUFilterModeType.Nearest,
    minFilter = GPUFilterModeType.Nearest,
    flipY = false,
    useMipmap = false,
    ...parameters
  }: DepthTextureParameters = {}) {
    super({ ...parameters, image: { width, height }, magFilter, minFilter, format, type });
    this.compare = parameters.compare;
  }

  static is(value: any): value is DepthTexture {
    return value.isDepthTexture;
  }
}

DepthTexture.prototype.isDepthTexture = true;

export interface DepthTextureParameters extends Omit<TextureParameters, 'image'> {
  width?: number;
  height?: number;
  type?: TextureDataType;
  format?: TextureFormat.Depth | TextureFormat.DepthStencil;
  compare?: GPUCompareFunctionType;
}
