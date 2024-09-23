import { Texture, TextureParameters } from './Texture.js';
import { GPUFilterModeType } from '../../hearth/constants.js';

export class VideoTexture extends Texture<HTMLVideoElement> {
  declare isVideoTexture: true;

  constructor({ video, ...params }: VideoTextureParameters) {
    super({
      image: video,
      magFilter: GPUFilterModeType.Linear,
      minFilter: GPUFilterModeType.Linear,
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
