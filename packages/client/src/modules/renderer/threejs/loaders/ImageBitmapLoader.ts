import { Cache } from './Cache.js';
import { Loader } from './Loader.js';
import { Configurable, ConfigurableConstructor, LoaderAsync } from '@modules/renderer/threejs/loaders/types.js';
import { FileLoader, FileLoaderResponse } from '@modules/renderer/threejs/loaders/FileLoader.js';

export class ImageBitmapLoader extends Loader {
  options: ImageBitmapOptions;
  isImageBitmapLoader: true = true;

  constructor(manager) {
    super(manager);

    this.isImageBitmapLoader = true;

    if (typeof createImageBitmap === 'undefined') {
      console.warn('THREE.ImageBitmapLoader: createImageBitmap() not supported.');
    }

    if (typeof fetch === 'undefined') {
      console.warn('THREE.ImageBitmapLoader: fetch() not supported.');
    }

    this.options = { premultiplyAlpha: 'none' };
  }

  load(url, handlers) {
    if (url === undefined) url = '';

    if (this.path !== undefined) url = this.path + url;

    url = this.manager.resolveURL(url);

    const scope = this;

    const cached = Cache.get(url);

    if (cached !== undefined) {
      scope.manager.itemStart(url);

      // If cached is a promise, wait for it to resolve
      if (cached.then) {
        cached
          .then(imageBitmap => {
            handlers?.onLoad?.(imageBitmap);

            scope.manager.itemEnd(url);
          })
          .catch(e => {
            handlers?.onError?.(e);
          });
        return;
      }

      // If cached is not a promise (i.e., it's already an imageBitmap)
      setTimeout(function () {
        handlers?.onLoad?.(cached);

        scope.manager.itemEnd(url);
      }, 0);

      return cached;
    }

    const fetchOptions: RequestInit = {};
    fetchOptions.credentials = this.crossOrigin === 'anonymous' ? 'same-origin' : 'include';
    fetchOptions.headers = this.requestHeader;

    const promise = fetch(url, fetchOptions)
      .then(function (res) {
        return res.blob();
      })
      .then(function (blob) {
        return createImageBitmap(blob, Object.assign(scope.options, { colorSpaceConversion: 'none' }));
      })
      .then(function (imageBitmap) {
        Cache.add(url, imageBitmap);

        handlers?.onLoad?.(imageBitmap);

        scope.manager.itemEnd(url);

        return imageBitmap;
      })
      .catch(function (e) {
        handlers?.onError?.(e);

        Cache.remove(url);

        scope.manager.itemError(url);
        scope.manager.itemEnd(url);
      });

    Cache.add(url, promise);
    scope.manager.itemStart(url);
  }
}

export const _ImageBitmapLoader = class<TData extends ImageBitmap, TUrl extends string>
  implements Configurable<Configuration>, LoaderAsync<TData, TUrl>
{
  configuration: Configuration;

  static configure(options?: Options): Configuration {
    return {
      responseType: FileLoaderResponse.Blob,
      credentials: options?.credentials ?? 'same-origin',
      headers: options?.headers,
      options: {
        premultiplyAlpha: options?.options?.premultiplyAlpha ?? 'none',
        imageOrientation: options?.options?.imageOrientation,
        resizeWidth: options?.options?.resizeWidth,
        resizeHeight: options?.options?.resizeHeight,
        colorSpaceConversion: 'none',
      },
    };
  }

  constructor(options?: Options) {
    this.configuration = _ImageBitmapLoader.configure(options);
  }

  async loadAsync<T extends TData, E = unknown>(url: TUrl, handlers?: LoaderAsync.Handlers<E>): Promise<T> {
    const buffer = await FileLoader.loadAsync(url, this.configuration, handlers);

    return (await createImageBitmap(buffer, this.configuration.options)) as T;
  }
} satisfies ConfigurableConstructor<Options, Configuration>;

export type _ImageBitmapLoader = (typeof _ImageBitmapLoader)['prototype'];

export namespace ImageBitmapLoader {
  export interface Options extends Omit<FileLoader.Options, 'responseType'> {
    options?: Omit<ImageBitmapOptions, 'colorSpaceConversion'>;
  }

  export interface Configuration extends Omit<FileLoader.Configuration, 'responseType'> {
    responseType: FileLoaderResponse.Blob;
    options: ImageBitmapOptions;
  }
}
type Options = ImageBitmapLoader.Options;
type Configuration = ImageBitmapLoader.Configuration;
