import { ImageLoader } from './ImageLoader.js';
import { CubeTexture } from '../textures/CubeTexture.js';
import { ColorSpace } from '../constants.js';
import { Configurable, ConfigurableConstructor, LoaderAsync } from '@modules/renderer/engine/loaders/types.js';

type Urls<T extends string> = [posx: T, negx: T, posy: T, negy: T, posz: T, negz: T];

const createCubeTexture = (images: HTMLImageElement[]): CubeTexture => {
  //@ts-expect-error
  const texture = new CubeTexture();
  texture.colorSpace = ColorSpace.SRGB;
  texture.images = images;
  texture.needsUpdate = true;
  return texture;
};

export const CubeTextureLoader = class<TUrl extends string = string>
  implements LoaderAsync<CubeTexture, Urls<TUrl>>, Configurable<Configuration>
{
  configuration: Configuration;

  static configure(options?: Options): Configuration {
    return {
      crossOrigin: options?.crossOrigin ?? 'anonymous',
    };
  }

  constructor(options?: Options) {
    this.configuration = CubeTextureLoader.configure(options);
  }

  async loadAsync<T extends CubeTexture, E = unknown>(
    urls: Urls<TUrl>,
    handlers?: LoaderAsync.Handlers<E>,
  ): Promise<T> {
    const images = await ImageLoader.loadAsyncMultiple(urls, this.configuration, handlers);

    return createCubeTexture(images) as T;
  }
} satisfies ConfigurableConstructor<Options, Configuration>;

export namespace CubeTextureLoader {
  export interface Options extends ImageLoader.Options {}

  export interface Configuration extends ImageLoader.Configuration {}
}
type Options = CubeTextureLoader.Options;
type Configuration = CubeTextureLoader.Configuration;
