import { FileLoader, ResponseType } from '@modules/renderer/engine/loaders/files/FileLoader/FileLoader.js';
import { classLoader } from '@modules/renderer/engine/loaders/types.js';
import { parseSTL } from '@modules/renderer/engine/loaders/objects/STLLoader/parseSTL.js';
import { Geometry } from '@modules/renderer/engine/core/Geometry.js';

export class STLLoader extends classLoader<{
  This: STLLoader;
  Url: string;
  Return: Geometry;
  Options: STLLoader.Options;
  Configuration: STLLoader.Configuration;
}>(
  options => ({ fileLoader: FileLoader.configureAs(ResponseType.Buffer, options?.fileLoader) }),
  async (url, { fileLoader }, handlers) => {
    const text = await FileLoader.loadAsync(url, fileLoader, handlers);

    return parseSTL(text);
  },
) {}

export namespace STLLoader {
  export interface Options {
    fileLoader?: Omit<FileLoader.Options, 'responseType'>;
  }

  export interface Configuration {
    fileLoader: FileLoader.Configuration<ResponseType.Buffer>;
  }
}
