import { FileLoader, ResponseType } from '@modules/renderer/engine/loaders/files/FileLoader/FileLoader.js';
import { classLoader } from '@modules/renderer/engine/loaders/types.js';
import { parseOBJ } from '@modules/renderer/engine/loaders/objects/OBJLoader/parseOBJ.js';
import { MTLMaterialCreator } from '@modules/renderer/engine/loaders/objects/OBJLoader/MTLLoader/MTLMaterialCreator.js';
import { Group } from '@modules/renderer/engine/entities/Group.js';

export class OBJLoader extends classLoader<{
  This: OBJLoader;
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
    materials?: MTLMaterialCreator;
  }

  export interface Configuration {
    fileLoader: FileLoader.Configuration<ResponseType.Text>;
    materials?: MTLMaterialCreator;
  }
}
type Options = OBJLoader.Options;
type Configuration = OBJLoader.Configuration;
