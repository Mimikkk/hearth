import { Texture } from './Texture.js';
import {
  MagnificationTextureFilter,
  Mapping,
  MinificationTextureFilter,
  TextureDataType,
  TextureFormat,
  Wrapping,
} from '../constants.js';

export class VideoTexture extends Texture {
  declare ['constructor']: typeof VideoTexture;
  declare isVideoTexture: true;

  constructor(
    video: HTMLVideoElement,
    mapping?: Mapping,
    wrapS?: Wrapping,
    wrapT?: Wrapping,
    magFilter?: MagnificationTextureFilter,
    minFilter?: MinificationTextureFilter,
    format?: TextureFormat,
    type?: TextureDataType,
    anisotropy?: number,
  ) {
    super(video, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy);

    this.minFilter = minFilter !== undefined ? minFilter : MinificationTextureFilter.Linear;
    this.magFilter = magFilter !== undefined ? magFilter : MagnificationTextureFilter.Linear;

    this.generateMipmaps = false;

    const scope = this;

    function updateVideo() {
      scope.needsUpdate = true;
      video.requestVideoFrameCallback(updateVideo);
    }

    if ('requestVideoFrameCallback' in video) {
      video.requestVideoFrameCallback(updateVideo);
    }
  }

  clone() {
    return new this.constructor(this.image).copy(this);
  }

  update() {
    const video = this.image;
    const hasVideoFrameCallback = 'requestVideoFrameCallback' in video;

    if (hasVideoFrameCallback === false && video.readyState >= video.HAVE_CURRENT_DATA) {
      this.needsUpdate = true;
    }
  }
}

VideoTexture.prototype.isVideoTexture = true;
