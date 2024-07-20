import { Texture } from './Texture.js';
import { MagnificationTextureFilter, MinificationTextureFilter } from '../constants.js';

export class VideoTexture extends Texture<HTMLVideoElement> {
  declare ['constructor']: typeof VideoTexture;
  declare isVideoTexture: true;

  constructor(video: HTMLVideoElement, options?: Options) {
    super(video, {
      ...options,
      minFilter: MinificationTextureFilter.Linear,
      magFilter: MagnificationTextureFilter.Linear,
      generateMipmaps: false,
    });

    video.requestVideoFrameCallback(function update() {
      video.requestVideoFrameCallback(update);
      this.needsUpdate = true;
    });
  }

  clone() {
    return new this.constructor(this.image).copy(this);
  }

  update() {
    const video = this.image;
    this.needsUpdate = true;
  }
}

export namespace VideoTexture {
  export type Options = Omit<Texture.Options, 'minFilter' | 'magFilter' | 'generateMipmaps'>;
}
type Options = VideoTexture.Options;

VideoTexture.prototype.isVideoTexture = true;
