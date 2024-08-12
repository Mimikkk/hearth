import { Texture, TextureParameters } from './Texture.js';
import { MagnificationTextureFilter, MinificationTextureFilter } from '../../constants.js';

export class VideoTexture extends Texture<HTMLVideoElement> {
  declare isVideoTexture: true;

  constructor({ video, ...params }: VideoTextureParameters) {
    super({
      image: video,
      magFilter: MagnificationTextureFilter.Linear,
      minFilter: MinificationTextureFilter.Linear,
      ...params,
      useMipmap: false,
    });

    const updateVideo = () => {
      this.useUpdate = true;
      video.requestVideoFrameCallback(updateVideo);
    };
    video.requestVideoFrameCallback(updateVideo);
  }

  static is(value: any): value is VideoTexture {
    return value?.isVideoTexture === true;
  }
}

VideoTexture.prototype.isVideoTexture = true;

export type VideoTextureParameters = Omit<TextureParameters, 'image'> & { video: HTMLVideoElement };
