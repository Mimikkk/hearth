import { FileLoader, ResponseType } from '@modules/renderer/engine/loaders/files/FileLoader/FileLoader.js';
import { classLoader } from '@modules/renderer/engine/loaders/types.js';
import { parseTtf } from './parseTtf.js';
import type { Font } from '../font.js';

export class TTFLoader extends classLoader<{
  This: TTFLoader;
  Url: string;
  Return: Font;
  Options: Options;
  Configuration: Configuration;
}>(
  options => ({
    fileLoader: FileLoader.configureAs(ResponseType.Buffer, options?.fileLoader),
    reversed: options?.reversed ?? false,
  }),
  async (url, { fileLoader, reversed }, handlers) => {
    const buffer = await FileLoader.loadAsync(url, fileLoader, handlers);

    return parseTtf(buffer, reversed);
  },
) {}

export namespace TTFLoader {
  export interface Options {
    fileLoader?: Omit<FileLoader.Options, 'responseType'>;
    reversed?: boolean;
  }

  export interface Configuration {
    fileLoader: FileLoader.Configuration<ResponseType.Buffer>;
    reversed: boolean;
  }
}
type Options = TTFLoader.Options;
type Configuration = TTFLoader.Configuration;
