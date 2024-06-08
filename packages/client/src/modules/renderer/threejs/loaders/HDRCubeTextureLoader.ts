import {
  ColorSpace,
  CubeTexture,
  DataTexture,
  MagnificationTextureFilter,
  MinificationTextureFilter,
  TextureDataType,
} from '../../threejs/Three.js';
import { parse, ParseResult } from './RGBELoader.js';
import { FileLoader, FileLoaderResponse } from '@modules/renderer/threejs/loaders/FileLoader.js';
import type { Configurable, ConfigurableConstructor, LoaderAsync } from './types.js';

export type CubeUrls<T extends string> = [posx: T, negx: T, posy: T, negy: T, posz: T, negz: T];
type SupportedType = TextureDataType.Float | TextureDataType.HalfFloat;

const createCubeTexture = (type: SupportedType): CubeTexture => {
  //@ts-expect-error - improve texture handling
  const texture = new CubeTexture();
  texture.type = type;
  texture.colorSpace = ColorSpace.LinearSRGB;
  texture.minFilter = MinificationTextureFilter.Linear;
  texture.magFilter = MagnificationTextureFilter.Linear;
  texture.generateMipmaps = false;

  return texture;
};
const createDataTexture = ({ data, width, height }: ParseResult, cube: CubeTexture): DataTexture => {
  //@ts-expect-error - improve texture handling
  const texture = new DataTexture(data, width, height);
  texture.type = cube.type;
  texture.colorSpace = cube.colorSpace;
  texture.format = cube.format;
  texture.minFilter = cube.minFilter;
  texture.magFilter = cube.magFilter;
  texture.generateMipmaps = cube.generateMipmaps;

  return texture;
};

export const HDRCubeTextureLoader = class<TUrl extends CubeUrls<string>>
  implements LoaderAsync<CubeTexture, TUrl>, Configurable<Configuration>
{
  static configure(options?: HDRCubeTextureLoader.Options): HDRCubeTextureLoader.Configuration {
    return {
      type: options?.type ?? TextureDataType.HalfFloat,
      credentials: options?.credentials ?? 'same-origin',
      headers: options?.headers,
      responseType: FileLoaderResponse.Buffer,
    };
  }

  configuration: HDRCubeTextureLoader.Configuration;

  constructor(options?: HDRCubeTextureLoader.Options) {
    this.configuration = HDRCubeTextureLoader.configure(options);
  }

  async loadAsync<T extends CubeTexture, E = unknown>(urls: TUrl, handlers?: LoaderAsync.Handlers<E>): Promise<T> {
    const buffers = await FileLoader.loadAsyncMultiple(urls, this.configuration, handlers);

    const texture = createCubeTexture(this.configuration.type) as T;
    texture.images = buffers.map(buffer => createDataTexture(parse(buffer, this.configuration.type), texture));
    texture.needsUpdate = true;

    return texture;
  }

  static async loadAsync<T extends CubeTexture, TUrl extends CubeUrls<string>, E = unknown>(
    urls: TUrl,
    options: HDRCubeTextureLoader.Configuration,
    handlers?: LoaderAsync.Handlers<E>,
  ): Promise<T> {
    return new HDRCubeTextureLoader(options).loadAsync(urls, handlers);
  }
} satisfies ConfigurableConstructor<Options, Configuration>;

export namespace HDRCubeTextureLoader {
  export interface Configuration extends Omit<FileLoader.Configuration, 'responseType'> {
    type: SupportedType;
    responseType: FileLoaderResponse.Buffer;
  }

  export type Options = Partial<Omit<Configuration, 'responseType'>>;
}
type Options = HDRCubeTextureLoader.Options;
type Configuration = HDRCubeTextureLoader.Configuration;
