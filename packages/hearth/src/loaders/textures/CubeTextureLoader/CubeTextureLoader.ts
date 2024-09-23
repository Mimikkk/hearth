import { ImageLoader } from '../ImageLoader/ImageLoader.js';
import { classLoader } from '../../types.js';
import { CubeTexture } from '../../../entities/textures/CubeTexture.js';
import { parseCubeTexture } from './parseCubeTexture.js';

type Urls<T extends string> = [posx: T, negx: T, posy: T, negy: T, posz: T, negz: T];

export class CubeTextureLoader extends classLoader<{
  This: CubeTextureLoader;
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

    return parseCubeTexture(images);
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
