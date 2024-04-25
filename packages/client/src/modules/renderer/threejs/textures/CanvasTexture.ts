import { Texture } from './Texture.js';
import {
  MagnificationTextureFilter,
  Mapping,
  MinificationTextureFilter,
  TextureDataType,
  TextureFormat,
  Wrapping,
} from '../constants.js';

export class CanvasTexture extends Texture {
  declare isCanvasTexture: true;

  constructor(
    canvas: TexImageSource | OffscreenCanvas,
    mapping?: Mapping,
    wrapS?: Wrapping,
    wrapT?: Wrapping,
    magFilter?: MagnificationTextureFilter,
    minFilter?: MinificationTextureFilter,
    format?: TextureFormat,
    type?: TextureDataType,
    anisotropy?: number,
  ) {
    super(canvas, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy);

    this.needsUpdate = true;
  }
}

CanvasTexture.prototype.isCanvasTexture = true;
