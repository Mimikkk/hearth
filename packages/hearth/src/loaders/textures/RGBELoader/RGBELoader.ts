import { TextureDataType } from '../../../constants.js';
import { parseRGBE, SupportedRGBEType } from './parseRGBE.js';
import { classLoader } from '../../types.js';
import { DataTexture } from '../../../entities/textures/DataTexture.js';
import { FileLoader, ResponseType } from '../../files/FileLoader/FileLoader.js';
export type { SupportedRGBEType } from './parseRGBE.js';

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
    type?: SupportedRGBEType;
  }

  export interface Configuration {
    fileLoader: FileLoader.Configuration<ResponseType.Buffer>;
    type: SupportedRGBEType;
  }
}
type Options = RGBELoader.Options;
type Configuration = RGBELoader.Configuration;
