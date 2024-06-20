import type { DataTexture } from '@modules/renderer/engine/engine.js';
import { classLoader } from '@modules/renderer/engine/loaders/types.js';
import { FileLoader, ResponseType } from '@modules/renderer/engine/loaders/files/FileLoader/FileLoader.js';
import { parseTiff } from '@modules/renderer/engine/loaders/textures/TIFFLoader/parseTiff.js';

export class TiffLoader extends classLoader<{
  This: TiffLoader;
  Url: string;
  Return: DataTexture;
  Options: Options;
  Configuration: Configuration;
}>(
  options => ({
    fileLoader: FileLoader.configureAs(ResponseType.Buffer, options?.fileLoader),
    maxRange: options?.maxRange ?? 16,
  }),
  async (url, { fileLoader }, handlers) => {
    const buffer = await FileLoader.loadAsync(url, fileLoader, handlers);

    return parseTiff(buffer);
  },
) {}

export namespace TiffLoader {
  export interface Options {
    fileLoader?: Omit<FileLoader.Configuration, 'responseType'>;
    maxRange?: number;
  }

  export interface Configuration {
    fileLoader: FileLoader.Configuration<ResponseType.Buffer>;
    maxRange: number;
  }
}

type Options = TiffLoader.Options;
type Configuration = TiffLoader.Configuration;
