import { ImageLoader } from './ImageLoader.js';
import { Texture } from '../textures/Texture.ts';
import { Loader } from './Loader.ts';

export class TextureLoader extends Loader {
  load(url, onLoad, onProgress, onError) {
    const texture = new Texture();

    const loader = new ImageLoader({
      manager: this.manager,
      crossOrigin: this.crossOrigin,
      path: this.path,
    });

    loader.load(
      url,
      function (image) {
        texture.image = image;
        texture.needsUpdate = true;

        if (onLoad !== undefined) {
          onLoad(texture);
        }
      },
      onProgress,
      onError,
    );

    return texture;
  }
}
