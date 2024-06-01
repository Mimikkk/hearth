import { ImageLoader } from './ImageLoader.ts';
import { Texture } from '../textures/Texture.ts';
import { Loader } from './Loader.js';

export class TextureLoader<TUrl extends string> extends Loader<any, TUrl> {
  load(url: TUrl, { onLoad, onProgress, onError = console.error }: Loader.Handlers<any, any>) {
    const texture = new Texture();

    const loader = new ImageLoader({
      manager: this.manager,
      crossOrigin: this.crossOrigin,
      path: this.path,
    });

    loader.load(url, {
      onLoad: image => {
        texture.image = image;
        texture.needsUpdate = true;
        onLoad?.(texture);
      },
      onProgress,
      onError,
    });

    return texture;
  }
}
