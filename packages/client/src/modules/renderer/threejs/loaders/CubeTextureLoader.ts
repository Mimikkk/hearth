import { ImageLoader } from './ImageLoader.js';
import { CubeTexture } from '../textures/CubeTexture.js';
import { Loader } from './Loader.js';
import { ColorSpace } from '../constants.js';

export class CubeTextureLoader extends Loader {
  load(urls, onLoad, onProgress, onError) {
    const texture = new CubeTexture();
    texture.colorSpace = ColorSpace.SRGB;

    const loader = new ImageLoader({
      manager: this.manager,
      crossOrigin: this.crossOrigin,
      path: this.path,
    });

    let loaded = 0;

    function loadTexture(i) {
      loader.load(
        urls[i],
        function (image) {
          texture.images[i] = image;

          loaded++;

          if (loaded === 6) {
            texture.needsUpdate = true;

            if (onLoad) onLoad(texture);
          }
        },
        undefined,
        onError,
      );
    }

    for (let i = 0; i < urls.length; ++i) {
      loadTexture(i);
    }

    return texture;
  }
}
