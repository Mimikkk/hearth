import { Texture } from './Texture.js';
import { Mapping, TextureDataType, TextureFormat, Wrapping } from '../../constants.js';
import { GPUFilterModeType } from '@modules/renderer/engine/hearth/constants.js';

export class CanvasTexture extends Texture {
  constructor(
    canvas: TexImageSource | OffscreenCanvas,
    mapping?: Mapping,
    wrapS?: Wrapping,
    wrapT?: Wrapping,
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
