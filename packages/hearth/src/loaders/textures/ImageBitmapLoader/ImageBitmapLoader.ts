import { classLoader } from '../../types.js';
import { FileLoader, ResponseType } from '../../files/FileLoader/FileLoader.js';

export class ImageBitmapLoader extends classLoader<{
  This: ImageBitmapLoader;
  Url: string;
  Return: ImageBitmap;
  Options: Options;
  Configuration: Configuration;
}>(
  options => ({
    fileLoader: FileLoader.configureAs(ResponseType.Blob, options?.fileLoader),
    options: {
      usePremultiplyAlpha: options?.options?.usePremultiplyAlpha ?? 'none',
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
    fileLoader: FileLoader.Configuration<ResponseType.Blob>;
    options: ImageBitmapOptions;
  }
}
type Options = ImageBitmapLoader.Options;
type Configuration = ImageBitmapLoader.Configuration;
