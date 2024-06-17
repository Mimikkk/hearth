import { classLoader } from '@modules/renderer/engine/loaders/types.js';
import { FileLoader, FileLoaderResponse } from '@modules/renderer/engine/loaders/FileLoader.js';

export class ImageBitmapLoader extends classLoader<{
  Url: string;
  Return: ImageBitmap;
  Options: Options;
  Configuration: Configuration;
}>(
  options => ({
    fileLoader: FileLoader.configureAs(FileLoaderResponse.Blob, options?.fileLoader),
    options: {
      premultiplyAlpha: options?.options?.premultiplyAlpha ?? 'none',
      imageOrientation: options?.options?.imageOrientation,
      resizeWidth: options?.options?.resizeWidth,
      resizeHeight: options?.options?.resizeHeight,
      colorSpaceConversion: 'none',
    },
  }),
  async (url, { fileLoader, options }, handlers) => {
    const buffer = await FileLoader.loadAsync(url, fileLoader, handlers);

    return createImageBitmap(buffer, options);
  },
) {}

export namespace ImageBitmapLoader {
  export interface Options {
    fileLoader?: Omit<FileLoader.Options, 'responseType'>;
    options?: Omit<ImageBitmapOptions, 'colorSpaceConversion'>;
  }

  export interface Configuration {
    fileLoader: FileLoader.Configuration<FileLoaderResponse.Blob>;
    options: ImageBitmapOptions;
  }
}
type Options = ImageBitmapLoader.Options;
type Configuration = ImageBitmapLoader.Configuration;
