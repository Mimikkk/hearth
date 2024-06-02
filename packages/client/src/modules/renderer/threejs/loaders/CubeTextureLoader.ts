import { ImageLoader } from './ImageLoader.js';
import { CubeTexture } from '../textures/CubeTexture.js';
import { Loader } from './Loader.js';
import { ColorSpace } from '../constants.js';

type Urls<T extends string> = [posx: T, negx: T, posy: T, negy: T, posz: T, negz: T];

export class CubeTextureLoader<TUrl extends string = string> extends Loader {
  constructor(options?: ImageLoader.Options) {
    super(options);
  }

  load(urls: Urls<TUrl>, handlers?: ImageLoader.Handlers<CubeTexture>): CubeTexture {
    //@ts-expect-error
    const texture = new CubeTexture();
    texture.colorSpace = ColorSpace.SRGB;

    const loader = new ImageLoader(this);

    let loaded = 0;
    const incrementCounter = () => loaded;

    for (let i = 0; i < 6; ++i) {
      loader.load(urls[i], {
        onLoad: this.createOnLoad(i, texture, incrementCounter, handlers?.onLoad),
        onError: handlers?.onError,
      });
    }

    return texture;
  }

  createOnLoad(
    index: number,
    texture: CubeTexture,
    incrementCounter: () => number,
    onLoad?: Loader.OnLoad<CubeTexture>,
  ) {
    return (image: HTMLImageElement) => {
      texture.images[index] = image;

      if (incrementCounter() === 6) {
        texture.needsUpdate = true;

        onLoad?.(texture);
      }
    };
  }
}
