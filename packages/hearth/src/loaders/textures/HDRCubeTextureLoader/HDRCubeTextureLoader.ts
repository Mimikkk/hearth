import { classLoader } from '../../types.js';
import { CubeTexture } from '../../../entities/textures/CubeTexture.js';
import { FileLoader, ResponseType } from '../../files/FileLoader/FileLoader.js';
import { TextureDataType } from '../../../constants.js';
import { parseHDRCubeTexture } from './parseHDRCubeTexture.js';

export type { SupportedHDRType } from './parseHDRCubeTexture.js';

export type CubeUrls<T extends string> = [posx: T, negx: T, posy: T, negy: T, posz: T, negz: T];

export class HDRCubeTextureLoader extends classLoader<{
  This: HDRCubeTextureLoader;
  Url: CubeUrls<string>;
  Return: CubeTexture;
  Options: Options;
  Configuration: Configuration;
}>(
  options => ({
    fileLoader: FileLoader.configureAs(ResponseType.Buffer, options?.fileLoader),
    type: options?.type ?? TextureDataType.HalfFloat,
  }),
  async (urls, { fileLoader, type }, handlers) => {
    const buffers = await FileLoader.loadAsyncMultiple(urls, fileLoader, handlers);

    return parseHDRCubeTexture(buffers, type);
  },
) {}

export namespace HDRCubeTextureLoader {
  export interface Configuration {
    fileLoader: FileLoader.Configuration<ResponseType.Buffer>;
    type: SupportedHDRType;
  }

  export type Options = {
    fileLoader?: Omit<FileLoader.Configuration, 'responseType'>;
    type?: SupportedHDRType;
  };
}
type Options = HDRCubeTextureLoader.Options;
type Configuration = HDRCubeTextureLoader.Configuration;
