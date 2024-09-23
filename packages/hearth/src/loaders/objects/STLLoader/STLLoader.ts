import { classLoader } from '../../types.js';
import { Geometry } from '../../../core/Geometry.js';
import { FileLoader, ResponseType } from '../../files/FileLoader/FileLoader.js';
import { parseSTL } from './parseSTL.js';

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
