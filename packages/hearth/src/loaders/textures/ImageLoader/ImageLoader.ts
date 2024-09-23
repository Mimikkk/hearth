import { classLoader } from '../../types.js';
import { createImage } from './createImage.js';

export class ImageLoader extends classLoader<{
  This: ImageLoader;
  Url: string;
  Return: HTMLImageElement;
  Options: Options;
  Configuration: Configuration;
}>(
  options => ({
    crossOrigin: options?.crossOrigin ?? 'anonymous',
  }),
  async (url, { crossOrigin }) => {
    const image = await createImage(url);

    image.crossOrigin = crossOrigin;

    return image;
  },
) {}

export namespace ImageLoader {
  export interface Options {
    crossOrigin?: string;
  }

  export interface Configuration {
    crossOrigin: string;
  }
}

type Options = ImageLoader.Options;
type Configuration = ImageLoader.Configuration;
