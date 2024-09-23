import { FileLoader, ResponseType } from '../../files/FileLoader/FileLoader.js';
import { classLoader } from '../../types.js';
import { Font } from '../font.js';

export class FontLoader extends classLoader<{
  This: FontLoader;
  Url: string;
  Return: Font;
  Options: Options;
  Configuration: Configuration;
}>(
  options => ({ fileLoader: FileLoader.configureAs(ResponseType.Json, options?.fileLoader) }),
  async (url, { fileLoader }, handlers) => await FileLoader.loadAsync(url, fileLoader, handlers),
) {}

export namespace FontLoader {
  export interface Options {
    fileLoader?: Omit<FileLoader.Options, 'responseType'>;
  }

  export interface Configuration {
    fileLoader: FileLoader.Configuration<ResponseType.Json>;
  }
}
type Options = FontLoader.Options;
type Configuration = FontLoader.Configuration;
