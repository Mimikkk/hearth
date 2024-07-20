import { Texture } from './Texture.js';
import { MagnificationTextureFilter, MinificationTextureFilter } from '../constants.js';

export class VideoTexture extends Texture<HTMLVideoElement> {
  declare isVideoTexture: true;

  constructor(video: HTMLVideoElement, options?: Options) {
    super(video, {
      ...options,
      minFilter: MinificationTextureFilter.Linear,
      magFilter: MagnificationTextureFilter.Linear,
      generateMipmaps: false,
    });

    const updateVideo = () => {
      this.needsUpdate = true;
      video.requestVideoFrameCallback(updateVideo);
    };

    video.requestVideoFrameCallback(updateVideo);
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
