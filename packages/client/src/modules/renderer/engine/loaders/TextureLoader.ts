import { ImageLoader } from './ImageLoader.js';
import { Texture } from '../textures/Texture.js';
import {
  Configurable,
  ConfigurableConstructor,
  LoaderAsync,
  MultiLoaderAsync,
} from '@modules/renderer/engine/loaders/types.js';

const createTexture = (image: HTMLImageElement) => {
  // @ts-expect-error
  const texture = new Texture();
  texture.image = image;
  texture.needsUpdate = true;
  return texture;
};

export const TextureLoader = class<TUrl extends string = string>
  implements LoaderAsync<Texture, TUrl>, MultiLoaderAsync<Texture, TUrl>, Configurable<Configuration>
{
  configuration: Configuration;

  static configure(options?: Options): Configuration {
    return {
      crossOrigin: options?.crossOrigin ?? 'anonymous',
    };
  }

  constructor(options?: Options) {
    this.configuration = ImageLoader.configure(options);
  }

  async loadAsync<T extends Texture, E = unknown>(url: TUrl, handlers?: LoaderAsync.Handlers<E>): Promise<T> {
    const image = await ImageLoader.loadAsync(url, this.configuration, handlers);

    return createTexture(image) as T;
  }

  static async loadAsync<T extends Texture, TUrl extends string, E = unknown>(
    url: TUrl,
    handlers?: LoaderAsync.Handlers<E>,
    options?: Options,
  ): Promise<T> {
    return new TextureLoader(options).loadAsync(url, handlers);
  }

  async loadAsyncMultiple<T extends Texture, E = unknown>(
    urls: TUrl[],
    handlers?: LoaderAsync.Handlers<E>,
  ): Promise<T[]> {
    const images = await ImageLoader.loadAsyncMultiple(urls, this.configuration, handlers);

    return images.map(createTexture) as T[];
  }

  static async loadAsyncMultiple<T extends Texture, TUrl extends string, E = unknown>(
    urls: TUrl[],
    handlers?: LoaderAsync.Handlers<E>,
    options?: Options,
  ): Promise<T[]> {
    return new TextureLoader(options).loadAsyncMultiple(urls, handlers);
  }
} satisfies ConfigurableConstructor<Options, Configuration>;

export namespace TextureLoader {
  export type Options = ImageLoader.Options;
  export type Configuration = ImageLoader.Configuration;
}
type Options = TextureLoader.Options;
type Configuration = TextureLoader.Configuration;
