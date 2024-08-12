import { ImageLoader } from '../ImageLoader/ImageLoader.js';
import { Texture } from '@modules/renderer/engine/entities/textures/Texture.js';
import { classLoader } from '@modules/renderer/engine/loaders/types.js';

const createTexture = (image: HTMLImageElement) => {
  const texture = new Texture();
  texture.image = image;
  texture.useUpdate = true;
  return texture;
};

export class TextureLoader extends classLoader<{
  This: TextureLoader;
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
