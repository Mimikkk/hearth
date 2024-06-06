import { Configurable, ConfigurableConstructor, LoaderAsync, MultiLoaderAsync } from './types.ts';

const createImage = async (src: string): Promise<HTMLImageElement> => {
  const image = document.createElement('img');

  const wait = new Promise<HTMLImageElement>((resolve, reject) => {
    function clearListeners() {
      image.removeEventListener('load', onLoad);
      image.removeEventListener('error', onError);
    }

    function onLoad() {
      clearListeners();
      resolve(image);
    }

    function onError(event: ErrorEvent) {
      console.error(event);
      clearListeners();
      reject(event.error);
    }

    image.addEventListener('load', onLoad);
    image.addEventListener('error', onError);
  });
  image.src = src;

  return wait;
};

export const ImageLoader = class<TUrl extends string = string>
  implements LoaderAsync<HTMLImageElement, TUrl>, MultiLoaderAsync<HTMLImageElement, TUrl>, Configurable<Configuration>
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

  async loadAsync<T extends HTMLImageElement, E = unknown>(url: TUrl, handler?: LoaderAsync.Handlers<E>): Promise<T> {
    const image = (await createImage(url)) as T;

    if (!url.startsWith('data:') && this.configuration.crossOrigin) image.crossOrigin = this.configuration.crossOrigin;

    return image;
  }

  static async loadAsync<T extends HTMLImageElement, TUrl extends string, E = unknown>(
    url: TUrl,
    options?: Options,
    handlers?: LoaderAsync.Handlers<E>,
  ): Promise<T> {
    return new ImageLoader(options).loadAsync(url, handlers);
  }

  loadAsyncMultiple<T extends HTMLImageElement, E = unknown>(
    url: TUrl[],
    handlers?: LoaderAsync.Handlers<E>,
  ): Promise<T[]> {
    const loader = new ImageLoader(this.configuration);

    return Promise.all(url.map(url => loader.loadAsync(url, handlers))) as Promise<T[]>;
  }

  static async loadAsyncMultiple<T extends HTMLImageElement, TUrl extends string, E = unknown>(
    urls: TUrl[],
    options?: Options,
    handlers?: LoaderAsync.Handlers<E>,
  ): Promise<T[]> {
    return new ImageLoader(options).loadAsyncMultiple(urls, handlers);
  }
} satisfies ConfigurableConstructor<Options, Configuration>;

export namespace ImageLoader {
  export interface Options {
    crossOrigin?: string;
  }

  export interface Configuration {
    crossOrigin?: string;
  }
}

type Options = ImageLoader.Options;
type Configuration = ImageLoader.Configuration;
