import { TextureDataType } from '../../../constants.js';
import { DataTexture } from '@modules/renderer/engine/entities/textures/DataTexture.js';
import { FileLoader, ResponseType } from '@modules/renderer/engine/loaders/files/FileLoader/FileLoader.js';
import { classLoader } from '@modules/renderer/engine/loaders/types.js';
import { parseRGBE } from '@modules/renderer/engine/loaders/textures/RGBELoader/parseRGBE.js';
import { SupportedType } from './parseRGBE.js';

export type { SupportedType } from './parseRGBE.js';

export class RGBELoader extends classLoader<{
  This: RGBELoader;
  Url: string;
  Return: DataTexture;
  Options: Options;
  Configuration: Configuration;
}>(
  options => ({
    fileLoader: FileLoader.configureAs(ResponseType.Buffer, options?.fileLoader),
    type: options?.type ?? TextureDataType.HalfFloat,
  }),
  async (url, configuration, handlers) => {
    const buffer = await FileLoader.loadAsync(url, configuration.fileLoader, handlers);

    return parseRGBE(buffer, configuration.type);
  },
) {}

export namespace RGBELoader {
  export interface Options {
    fileLoader?: Omit<FileLoader.Options, 'responseType'>;
    type?: SupportedType;
  }

  export interface Configuration {
    fileLoader: FileLoader.Configuration<ResponseType.Buffer>;
    type: SupportedType;
  }
}
type Options = RGBELoader.Options;
type Configuration = RGBELoader.Configuration;
