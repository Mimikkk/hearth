import type { Geometry } from '../../../core/Geometry.js';
import { classLoader } from '@modules/renderer/engine/loaders/types.js';
import { FileLoader, ResponseType } from '@modules/renderer/engine/loaders/files/FileLoader/FileLoader.js';
import { parseGeometry } from '@modules/renderer/engine/loaders/geometries/GeometryLoader/parseGeometry.js';

export class GeometryLoader extends classLoader<{
  This: GeometryLoader;
  Url: string;
  Return: Geometry;
  Options: Options;
  Configuration: Configuration;
}>(
  options => ({ fileLoader: FileLoader.configureAs(ResponseType.Json, options?.fileLoader) }),
  async (url, { fileLoader }, handlers) => parseGeometry(await FileLoader.loadAsync(url, fileLoader, handlers)),
) {}

export namespace GeometryLoader {
  export interface Options {
    fileLoader?: Omit<FileLoader.Options, 'responseType'>;
  }

  export type Configuration = {
    fileLoader: FileLoader.Configuration<ResponseType.Json>;
  };
}
type Options = GeometryLoader.Options;
type Configuration = GeometryLoader.Configuration;
