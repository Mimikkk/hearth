import { Configurable, ConfigurableConstructor, LoaderAsync } from '@modules/renderer/threejs/loaders/types.js';
import { FileLoader, FileLoaderResponse } from '@modules/renderer/threejs/loaders/FileLoader.js';

export const ImageBitmapLoader = class<TData extends ImageBitmap, TUrl extends string>
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
    this.configuration = ImageBitmapLoader.configure(options);
  }

  async loadAsync<T extends TData, E = unknown>(url: TUrl, handlers?: LoaderAsync.Handlers<E>): Promise<T> {
    const buffer = await FileLoader.loadAsync(url, this.configuration, handlers);

    return (await createImageBitmap(buffer, this.configuration.options)) as T;
  }
} satisfies ConfigurableConstructor<Options, Configuration>;

export type ImageBitmapLoader = InstanceType<typeof ImageBitmapLoader>;

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
