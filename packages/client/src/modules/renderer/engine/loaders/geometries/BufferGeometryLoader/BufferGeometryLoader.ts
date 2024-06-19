import type { BufferGeometry } from '../../../core/BufferGeometry.js';
import { classLoader } from '@modules/renderer/engine/loaders/types.js';
import { FileLoader, ResponseType } from '@modules/renderer/engine/loaders/files/FileLoader/FileLoader.js';
import { parseBufferGeometry } from '@modules/renderer/engine/loaders/geometries/BufferGeometryLoader/parseBufferGeometry.js';

export class BufferGeometryLoader extends classLoader<{
  Url: string;
  Return: BufferGeometry;
  Options: Options;
  Configuration: Configuration;
}>(
  options => ({ fileLoader: FileLoader.configureAs(ResponseType.Json, options?.fileLoader) }),
  async (url, { fileLoader }, handlers) => parseBufferGeometry(await FileLoader.loadAsync(url, fileLoader, handlers)),
) {}

export namespace BufferGeometryLoader {
  export interface Options {
    fileLoader?: Omit<FileLoader.Options, 'responseType'>;
  }

  export type Configuration = {
    fileLoader: FileLoader.Configuration<ResponseType.Json>;
  };
}
type Options = BufferGeometryLoader.Options;
type Configuration = BufferGeometryLoader.Configuration;
