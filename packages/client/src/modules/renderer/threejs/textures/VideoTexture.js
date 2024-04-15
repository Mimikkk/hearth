import { Filter } from '../constants.ts';
import { Texture } from './Texture.js';

class VideoTexture extends Texture {
  constructor(video, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy) {
    super(video, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy);

    this.isVideoTexture = true;

    this.minFilter = minFilter !== undefined ? minFilter : Filter.Linear;
    this.magFilter = magFilter !== undefined ? magFilter : Filter.Linear;

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

export { VideoTexture };
