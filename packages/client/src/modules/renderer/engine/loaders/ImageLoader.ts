import { classLoader } from './types.ts';

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
      clearListeners();
      reject(event);
      throw Error(`Failed to load image: '${src}'`);
    }

    image.addEventListener('load', onLoad);
    image.addEventListener('error', onError);
  });
  image.src = src;

  return wait;
};

export class ImageLoader extends classLoader<{
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

    if (!url.startsWith('data:') && crossOrigin) image.crossOrigin = crossOrigin;

    return image;
  },
) {}

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
