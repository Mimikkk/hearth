import {
  CubeTexture,
  DataTexture,
  DataUtils,
  MagnificationTextureFilter,
  MinificationTextureFilter,
  TextureDataType,
  TextureFormat,
  Wrapping,
} from '../../threejs/Three.js';
import * as upng from 'upng-js';
import { Configurable, ConfigurableConstructor, LoaderAsync } from './types.ts';
import { FileLoader, FileLoaderResponse } from '@modules/renderer/threejs/loaders/FileLoader.js';

type Urls<T extends string> = [posx: T, negx: T, posy: T, negy: T, posz: T, negz: T];

const parse = (buffer: ArrayBuffer, { type, maxRange }: RGBMLoader.Configuration): ParseResult => {
  const img = upng.decode(buffer);
  const rgba = upng.toRGBA8(img)[0];

  const data = new Uint8Array(rgba);
  const size = img.width * img.height * 4;

  const output = type === TextureDataType.HalfFloat ? new Uint16Array(size) : new Float32Array(size);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;
    const a = data[i + 3] / 255;

    if (type === TextureDataType.HalfFloat) {
      output[i] = DataUtils.toHalfFloat(Math.min(r * a * maxRange, 65504));
      output[i + 1] = DataUtils.toHalfFloat(Math.min(g * a * maxRange, 65504));
      output[i + 2] = DataUtils.toHalfFloat(Math.min(b * a * maxRange, 65504));
      output[i + 3] = DataUtils.toHalfFloat(1);
    } else {
      output[i] = r * a * maxRange;
      output[i + 1] = g * a * maxRange;
      output[i + 2] = b * a * maxRange;
      output[i + 3] = 1;
    }
  }

  return {
    width: img.width,
    height: img.height,
    data: output,
    format: TextureFormat.RGBA,
    type: type,
    flipY: true,
  };
};

interface ParseResult {
  data: Uint16Array | Float32Array;
  width: number;
  height: number;
  format: TextureFormat;
  type: TextureDataType;
  flipY: boolean;
}

const createCubeTexture = (images: DataTexture[], configuration: Configuration): CubeTexture => {
  //@ts-expect-error - improve texture handling
  const texture = new CubeTexture();
  texture.images = images;
  texture.type = configuration.type;
  texture.format = TextureFormat.RGBA;
  texture.minFilter = MinificationTextureFilter.Linear;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;

  return texture;
};
const createDataTexture = (buffer: ArrayBuffer, configuration: Configuration) => {
  //@ts-expect-error
  const texture = new DataTexture();
  texture.wrapS = Wrapping.ClampToEdge;
  texture.wrapT = Wrapping.ClampToEdge;
  texture.magFilter = MagnificationTextureFilter.Linear;
  texture.minFilter = MinificationTextureFilter.Linear;
  texture.anisotropy = 1;

  const details = parse(buffer, configuration);
  texture.image.width = details.width;
  texture.image.height = details.height;
  texture.image.data = details.data;
  texture.flipY = details.flipY;
  texture.format = details.format;
  texture.type = details.type;
  texture.needsUpdate = true;

  return texture;
};

export const RGBMLoader = class<TData extends CubeTexture, TUrl extends string = string>
  implements Configurable<Configuration>, LoaderAsync<TData, Urls<TUrl>>
{
  configuration: Configuration;

  static configure(options?: Options): Configuration {
    return {
      responseType: FileLoaderResponse.Buffer,
      headers: options?.headers,
      credentials: options?.credentials ?? 'same-origin',
      type: options?.type ?? TextureDataType.HalfFloat,
      maxRange: options?.maxRange ?? 7,
    };
  }

  constructor(options?: Options) {
    this.configuration = RGBMLoader.configure(options);
  }

  async loadAsync<T extends TData, E = unknown>(urls: Urls<TUrl>, handlers?: LoaderAsync.Handlers<E>): Promise<T> {
    const buffers = await FileLoader.loadAsyncMultiple(urls, this.configuration, handlers);
    const images = buffers.map(buffer => createDataTexture(buffer, this.configuration));

    return createCubeTexture(images, this.configuration) as T;
  }

  static async loadAsync<T extends CubeTexture, TUrl extends string, E = unknown>(
    urls: Urls<TUrl>,
    options: Configuration,
    handlers?: LoaderAsync.Handlers<E>,
  ): Promise<T> {
    return new RGBMLoader(options).loadAsync(urls, handlers);
  }
} satisfies ConfigurableConstructor<Options, Configuration>;

export namespace RGBMLoader {
  export type SupportedType = TextureDataType.HalfFloat | TextureDataType.Float;

  export interface Options extends FileLoader.Options {
    type?: SupportedType;
    maxRange?: number;
  }

  export interface Configuration extends FileLoader.Configuration {
    type: SupportedType;
    maxRange: number;
  }
}

type Options = RGBMLoader.Options;
type Configuration = RGBMLoader.Configuration;
