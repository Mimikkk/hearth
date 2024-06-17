import { ImageLoader } from './ImageLoader.js';
import { CubeTexture } from '../textures/CubeTexture.js';
import { ColorSpace } from '../constants.js';
import { classLoader } from '@modules/renderer/engine/loaders/types.js';

type Urls<T extends string> = [posx: T, negx: T, posy: T, negy: T, posz: T, negz: T];

const createCubeTexture = (images: HTMLImageElement[]): CubeTexture => {
  //@ts-expect-error
  const texture = new CubeTexture();
  texture.colorSpace = ColorSpace.SRGB;
  texture.images = images;
  texture.needsUpdate = true;
  return texture;
};

export class CubeTextureLoader extends classLoader<{
  Url: Urls<string>;
  Return: CubeTexture;
  Options: Options;
  Configuration: Configuration;
}>(
  options => ({
    imageLoader: ImageLoader.configure(options?.imageLoader),
  }),
  async (urls, { imageLoader }, handlers) => {
    const images = await ImageLoader.loadAsyncMultiple(urls, imageLoader, handlers);

    return createCubeTexture(images);
  },
) {}

export namespace CubeTextureLoader {
  export interface Options {
    imageLoader?: ImageLoader.Options;
  }

  export interface Configuration {
    imageLoader?: ImageLoader.Configuration;
  }
}
type Options = CubeTextureLoader.Options;
type Configuration = CubeTextureLoader.Configuration;
