import { Loader } from './Loader.js';
import { Configurable, ConfigurableConstructor, LoaderAsync, MultiLoaderAsync } from './types.ts';

export class ImageLoader<TUrl extends string = string> extends Loader {
  constructor(options?: ImageLoader.Options) {
    super(options);
  }

  load(url: TUrl, handlers?: ImageLoader.Handlers) {
    let uri: string = url;
    if (this.path !== undefined) uri = this.path + uri;
    uri = this.manager.resolveURL(uri);

    const scope = this;

    const image = document.createElement('img');

    function clearListeners() {
      image.removeEventListener('load', onImageLoad, false);
      image.removeEventListener('error', onImageError, false);
    }

    function onImageLoad() {
      clearListeners();

      console.log(this);
      handlers?.onLoad?.(this);
    }

    function onImageError(event: ErrorEvent) {
      clearListeners();

      handlers?.onError?.(event);

      scope.manager.itemError(uri);
      scope.manager.itemEnd(uri);
    }

    image.addEventListener('load', onImageLoad, false);
    image.addEventListener('error', onImageError, false);

    if (uri.slice(0, 5) !== 'data:' && this.crossOrigin !== undefined) image.crossOrigin = this.crossOrigin;

    scope.manager.itemStart(uri);

    console.log(uri);
    image.src = uri;

    return image;
  }
}

export namespace ImageLoader {
  export interface Options extends Pick<Loader.Options, 'manager' | 'crossOrigin' | 'path'> {}

  export interface Handlers<T = HTMLImageElement> extends Pick<Loader.Handlers<T>, 'onLoad' | 'onError'> {}
}

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

export const _ImageLoader = class<TUrl extends string = string>
  implements LoaderAsync<HTMLImageElement, TUrl>, MultiLoaderAsync<HTMLImageElement, TUrl>, Configurable<Configuration>
{
  configuration: Configuration;

  static configure(options?: Options): Configuration {
    return {
      crossOrigin: options?.crossOrigin ?? 'anonymous',
    };
  }

  constructor(options?: Options) {
    this.configuration = _ImageLoader.configure(options);
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
    return new _ImageLoader(options).loadAsync(url, handlers);
  }

  loadAsyncMultiple<T extends HTMLImageElement, E = unknown>(
    url: TUrl[],
    handlers?: LoaderAsync.Handlers<E>,
  ): Promise<T[]> {
    const loader = new _ImageLoader(this.configuration);

    return Promise.all(url.map(url => loader.loadAsync(url, handlers))) as Promise<T[]>;
  }

  static async loadAsyncMultiple<T extends HTMLImageElement, TUrl extends string, E = unknown>(
    urls: TUrl[],
    options?: Options,
    handlers?: LoaderAsync.Handlers<E>,
  ): Promise<T[]> {
    return new _ImageLoader(options).loadAsyncMultiple(urls, handlers);
  }
} satisfies ConfigurableConstructor<Options, Configuration>;

export namespace _ImageLoader {
  export interface Options {
    crossOrigin?: string;
  }

  export interface Configuration {
    crossOrigin?: string;
  }
}

type Options = _ImageLoader.Options;
type Configuration = _ImageLoader.Configuration;
