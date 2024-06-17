import { ImageLoader } from './ImageLoader.js';
import { Texture } from '../textures/Texture.js';
import { classLoader } from '@modules/renderer/engine/loaders/types.js';

const createTexture = (image: HTMLImageElement) => {
  // @ts-expect-error
  const texture = new Texture();
  texture.image = image;
  texture.needsUpdate = true;
  return texture;
};

export class TextureLoader extends classLoader<{
  Url: string;
  Return: Texture;
  Options: Options;
  Configuration: Configuration;
}>(
  options => ({ imageLoader: ImageLoader.configure(options?.imageLoader) }),
  async (url, { imageLoader }, handlers) => {
    const image = await ImageLoader.loadAsync(url, imageLoader, handlers);

    return createTexture(image);
  },
) {}

export namespace TextureLoader {
  export interface Options {
    imageLoader?: ImageLoader.Options;
  }

  export interface Configuration {
    imageLoader: ImageLoader.Configuration;
  }
}
type Options = TextureLoader.Options;
type Configuration = TextureLoader.Configuration;
