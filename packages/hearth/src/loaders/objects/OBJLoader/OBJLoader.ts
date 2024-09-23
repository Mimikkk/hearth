import { classLoader } from '../../types.js';
import { Group } from '../../../entities/Group.js';
import { FileLoader, ResponseType } from '../../files/FileLoader/FileLoader.js';
import { parseOBJ } from './parseOBJ.js';
import { MTLMaterialCreator } from './MTLLoader/MTLMaterialCreator.js';

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
