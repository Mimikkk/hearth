import { classLoader } from '../../types.js';
import { FileLoader, ResponseType } from '@modules/renderer/engine/loaders/files/FileLoader/FileLoader.js';
import { parseRGBM } from '@modules/renderer/engine/loaders/textures/RGBMLoader/parseRGBM.js';
import { CubeTexture } from '@modules/renderer/engine/entities/textures/CubeTexture.js';
import { TextureDataType } from '@modules/renderer/engine/constants.js';

type Urls<T extends string> = [posx: T, negx: T, posy: T, negy: T, posz: T, negz: T];

export class RGBMLoader extends classLoader<{
  This: RGBMLoader;
  Url: Urls<string>;
  Return: CubeTexture;
  Options: Options;
  Configuration: Configuration;
}>(
  options => ({
    fileLoader: FileLoader.configureAs(ResponseType.Buffer, options?.fileLoader),
    type: options?.type ?? TextureDataType.HalfFloat,
    maxRange: options?.maxRange ?? 7,
  }),
  async (urls, { fileLoader, maxRange, type }, handlers) => {
    const buffers = await FileLoader.loadAsyncMultiple(urls, fileLoader, handlers);

    return parseRGBM(buffers, type, maxRange);
  },
) {}

export namespace RGBMLoader {
  export type SupportedType = TextureDataType.HalfFloat | TextureDataType.Float;

  export interface Options {
    fileLoader?: Omit<FileLoader.Options, 'responseType'>;
    type?: SupportedType;
    maxRange?: number;
  }

  export interface Configuration {
    fileLoader: FileLoader.Configuration<ResponseType.Buffer>;
    type: SupportedType;
    maxRange: number;
  }
}

type Options = RGBMLoader.Options;
type Configuration = RGBMLoader.Configuration;
