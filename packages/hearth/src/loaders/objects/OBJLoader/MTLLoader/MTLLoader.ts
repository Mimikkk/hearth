import { classLoader } from '../../../types.js';
import { MTLMaterialCreator } from './MTLMaterialCreator.js';
import { FileLoader, ResponseType } from '../../../files/FileLoader/FileLoader.js';
import { LoaderUtils } from '../../../LoaderUtils.js';
import { parseMTL } from './parseMTL.js';

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
