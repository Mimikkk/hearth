import { Texture } from './Texture.js';
import { Mapping, TextureDataType, TextureFormat } from '../../constants.js';
import { GPUAddressModeType, GPUFilterModeType } from '../../hearth/constants.js';

export class CanvasTexture extends Texture {
  constructor(
    canvas: TexImageSource | OffscreenCanvas,
    mapping?: Mapping,
    wrapS?: GPUAddressModeType,
    wrapT?: GPUAddressModeType,
    magFilter?: GPUFilterModeType,
    minFilter?: GPUFilterModeType,
    format?: TextureFormat,
    type?: TextureDataType,
    anisotropy?: number,
  ) {
    super(canvas, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy);

    this.useUpdate = true;
  }
}
