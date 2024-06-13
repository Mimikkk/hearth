import {
  DataTexture,
  MagnificationTextureFilter,
  MinificationTextureFilter,
  Wrapping,
} from '@modules/renderer/engine/engine.js';

import * as UTIF from 'utif';
import { Configurable, ConfigurableConstructor, LoaderAsync } from '@modules/renderer/engine/loaders/types.js';
import { FileLoader, FileLoaderResponse } from '@modules/renderer/engine/loaders/FileLoader.js';

interface ParseResult {
  data: Uint8Array;
  width: number;
  height: number;
  flipY: boolean;
  magFilter: MagnificationTextureFilter;
  minFilter: MinificationTextureFilter;
}

const parseTiff = (buffer: ArrayBuffer): ParseResult => {
  const [ifds] = UTIF.decode(buffer);
  UTIF.decodeImage(buffer, ifds);
  const data = UTIF.toRGBA8(ifds);

  return {
    data,
    width: ifds.width,
    height: ifds.height,
    flipY: true,
    magFilter: MagnificationTextureFilter.Linear,
    minFilter: MinificationTextureFilter.LinearMipmapLinear,
  };
};

const createDataTexture = (details: ParseResult) => {
  //@ts-expect-error - improve texture handling
  const texture = new DataTexture();
  texture.image.width = details.width;
  texture.image.height = details.height;
  texture.image.data = details.data;
  texture.wrapS = Wrapping.ClampToEdge;
  texture.wrapT = Wrapping.ClampToEdge;
  texture.magFilter = details.magFilter;
  texture.minFilter = details.minFilter;
  texture.anisotropy = 1;
  texture.flipY = details.flipY;
  texture.needsUpdate = true;

  return texture;
};

export const TiffLoader = class<TUrl extends string = string>
  implements Configurable<Configuration>, LoaderAsync<DataTexture, TUrl>
{
  configuration: Configuration;

  static configure(options?: Options): Configuration {
    return {
      headers: options?.headers,
      credentials: options?.credentials ?? 'same-origin',
      maxRange: options?.maxRange ?? 16,
      responseType: FileLoaderResponse.Buffer,
    };
  }

  constructor(options?: Options) {
    this.configuration = TiffLoader.configure(options);
  }

  async loadAsync<T extends DataTexture, E = unknown>(url: TUrl, handlers?: LoaderAsync.Handlers<E>): Promise<T> {
    const buffer = await FileLoader.loadAsync(url, this.configuration, handlers);

    return createDataTexture(parseTiff(buffer)) as T;
  }

  static async loadAsync<T extends DataTexture, TUrl extends string, E = unknown>(
    url: TUrl,
    options?: Options,
    handlers?: LoaderAsync.Handlers<E>,
  ): Promise<T> {
    return new TiffLoader(options).loadAsync(url, handlers);
  }
} satisfies ConfigurableConstructor<Options, Configuration>;

export namespace TiffLoader {
  export interface Options extends FileLoader.Options {
    maxRange?: number;
  }

  export interface Configuration extends Omit<FileLoader.Configuration, 'responseType'> {
    responseType: FileLoaderResponse.Buffer;
    maxRange: number;
  }
}

type Options = TiffLoader.Options;
type Configuration = TiffLoader.Configuration;
