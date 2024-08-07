import { FileLoader, ResponseType } from '@modules/renderer/engine/loaders/files/FileLoader/FileLoader.js';
import { classLoader } from '@modules/renderer/engine/loaders/types.js';
import { parseMTL } from '@modules/renderer/engine/loaders/objects/OBJLoader/MTLLoader/parseMTL.js';
import { MTLMaterialCreator } from '@modules/renderer/engine/loaders/objects/OBJLoader/MTLLoader/MTLMaterialCreator.js';
import { LoaderUtils } from '@modules/renderer/engine/loaders/LoaderUtils.js';

export class MTLLoader extends classLoader<{
  This: MTLLoader;
  Url: string;
  Return: MTLMaterialCreator;
  Options: Options;
  Configuration: Configuration;
}>(
  options => ({ fileLoader: FileLoader.configureAs(ResponseType.Text, options?.fileLoader) }),
  async (url, { fileLoader }, handlers) => {
    const path = LoaderUtils.extractUrlBase(url);

    const text = await FileLoader.loadAsync(url, fileLoader, handlers);

    return parseMTL(text, path);
  },
) {}

export namespace MTLLoader {
  export interface Options {
    fileLoader?: FileLoader.Options;
  }

  export interface Configuration {
    fileLoader: FileLoader.Configuration<ResponseType.Text>;
  }
}
type Options = MTLLoader.Options;
type Configuration = MTLLoader.Configuration;
