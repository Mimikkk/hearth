import { TextureDataType } from '@modules/renderer/engine/constants.js';
import { DataTexture } from '@modules/renderer/engine/objects/textures/DataTexture.js';
import { classLoader } from '@modules/renderer/engine/loaders/types.js';
import { FileLoader, ResponseType } from '@modules/renderer/engine/loaders/files/FileLoader/FileLoader.js';
import { parseIES, SupportedType } from './parseIES.js';

export type { SupportedType, SupportedMap } from './parseIES.js';

export class IESLoader extends classLoader<{
  This: IESLoader;
  Url: string;
  Return: DataTexture;
  Options: Options;
  Configuration: Configuration;
}>(
  options => ({
    fileLoader: FileLoader.configureAs(ResponseType.Text, options?.fileLoader),
    type: options?.type ?? TextureDataType.HalfFloat,
  }),
  async (url, { fileLoader, type }, handlers) => {
    const text = await FileLoader.loadAsync(url, fileLoader, handlers);

    return parseIES(text, type);
  },
) {}

export namespace IESLoader {
  export interface Configuration {
    fileLoader: FileLoader.Configuration<ResponseType.Text>;
    type: SupportedType;
  }

  export interface Options {
    fileLoader?: Omit<FileLoader.Configuration, 'responseType'>;
    type?: SupportedType;
  }
}
type Options = IESLoader.Options;
type Configuration = IESLoader.Configuration;
