import { ImageLoader } from './ImageLoader.js';
import { CubeTexture } from '../textures/CubeTexture.js';
import { ColorSpace } from '../constants.js';
import { Configurable, ConfigurableConstructor, LoaderAsync } from '@modules/renderer/threejs/loaders/types.js';

type Urls<T extends string> = [posx: T, negx: T, posy: T, negy: T, posz: T, negz: T];

export const _CubeTextureLoader = class<TUrl extends string = string>
  implements LoaderAsync<CubeTexture, Urls<TUrl>>, Configurable<Configuration>
{
  configuration: Configuration;

  static configure(options?: Options): Configuration {
    return {
      crossOrigin: options?.crossOrigin ?? 'anonymous',
    };
  }

  constructor(options?: Options) {
    this.configuration = _CubeTextureLoader.configure(options);
  }

  async loadAsync<T extends CubeTexture, E = unknown>(
    urls: Urls<TUrl>,
    handlers?: LoaderAsync.Handlers<E>,
  ): Promise<T> {
    //@ts-expect-error
    const texture = new CubeTexture() as T;
    texture.colorSpace = ColorSpace.SRGB;
    texture.images = await ImageLoader.loadAsyncMultiple(urls, handlers, this.configuration);
    texture.needsUpdate = true;
    return texture;
  }
} satisfies ConfigurableConstructor<Options, Configuration>;

export namespace _CubeTextureLoader {
  export type Options = ImageLoader.Options & {};

  export type Configuration = ImageLoader.Configuration & {};
}
type Options = _CubeTextureLoader.Options;
type Configuration = _CubeTextureLoader.Configuration;
