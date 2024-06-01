import { ImageLoader } from './ImageLoader.js';
import { CubeTexture } from '../textures/CubeTexture.js';
import { Loader } from './Loader.js';
import { ColorSpace } from '../constants.js';

export class CubeTextureLoader extends Loader {
  constructor(options?: ImageLoader.Options) {
    super(options);
  }

  load(urls, onLoad, onProgress, onError) {
    const texture = new CubeTexture();
    texture.colorSpace = ColorSpace.SRGB;

    const loader = new ImageLoader(this);

    let loaded = 0;
    for (let i = 0; i < urls.length; ++i) {
      loader.load(urls[i], {
        onLoad: image => {
          texture.images[i] = image;

          ++loaded;

          if (loaded === 6) {
            texture.needsUpdate = true;

            onLoad?.(texture);
          }
        },
        onError,
      });
    }

    return texture;
  }
}
