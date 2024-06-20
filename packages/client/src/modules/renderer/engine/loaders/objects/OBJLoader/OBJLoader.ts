import { Group } from '@modules/renderer/engine/engine.js';
import { FileLoader, ResponseType } from '@modules/renderer/engine/loaders/files/FileLoader/FileLoader.js';
import { classLoader } from '@modules/renderer/engine/loaders/types.js';
import { parseOBJ } from '@modules/renderer/engine/loaders/objects/OBJLoader/parseOBJ.js';
import { MaterialCreator } from '@modules/renderer/engine/loaders/objects/OBJLoader/MaterialCreator.js';

export class OBJLoader extends classLoader<{
  Url: string;
  Return: Group;
  Options: Options;
  Configuration: Configuration;
}>(
  options => ({
    fileLoader: FileLoader.configureAs(ResponseType.Text, options?.fileLoader),
    materials: options?.materials,
  }),
  async (url, { fileLoader, materials }, handlers) => {
    const text = await FileLoader.loadAsync(url, fileLoader, handlers);

    return await parseOBJ(text, materials);
  },
) {}

export namespace OBJLoader {
  export interface Options {
    fileLoader?: Omit<FileLoader.Options, 'responseType'>;
    materials?: MaterialCreator;
  }

  export interface Configuration {
    fileLoader: FileLoader.Configuration<ResponseType.Text>;
    materials?: MaterialCreator;
  }
}
type Options = OBJLoader.Options;
type Configuration = OBJLoader.Configuration;
