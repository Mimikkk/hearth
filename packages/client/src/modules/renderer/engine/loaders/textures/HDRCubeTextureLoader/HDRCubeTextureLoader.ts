import { FileLoader, ResponseType } from '@modules/renderer/engine/loaders/files/FileLoader/FileLoader.js';
import { classLoader } from '../../types.js';
import { parseHDRCubeTexture } from '@modules/renderer/engine/loaders/textures/HDRCubeTextureLoader/parseHDRCubeTexture.js';
import type { SupportedHDRType } from './parseHDRCubeTexture.js';
import { CubeTexture } from '@modules/renderer/engine/entities/textures/CubeTexture.js';
import { TextureDataType } from '@modules/renderer/engine/constants.js';

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
