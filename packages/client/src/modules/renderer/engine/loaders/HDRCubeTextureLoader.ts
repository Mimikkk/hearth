import {
  ColorSpace,
  CubeTexture,
  DataTexture,
  MagnificationTextureFilter,
  MinificationTextureFilter,
  TextureDataType,
} from '@modules/renderer/engine/engine.js';
import { parse, ParseResult } from './RGBELoader.js';
import { FileLoader, FileLoaderResponse } from '@modules/renderer/engine/loaders/FileLoader.js';
import { classLoader } from './types.js';

export type CubeUrls<T extends string> = [posx: T, negx: T, posy: T, negy: T, posz: T, negz: T];
type SupportedType = TextureDataType.Float | TextureDataType.HalfFloat;

const createCubeTexture = (type: SupportedType): CubeTexture => {
  //@ts-expect-error - improve texture handling
  const texture = new CubeTexture();
  texture.type = type;
  texture.colorSpace = ColorSpace.LinearSRGB;
  texture.minFilter = MinificationTextureFilter.Linear;
  texture.magFilter = MagnificationTextureFilter.Linear;
  texture.generateMipmaps = false;

  return texture;
};
const createDataTexture = ({ data, width, height }: ParseResult, cube: CubeTexture): DataTexture => {
  //@ts-expect-error - improve texture handling
  const texture = new DataTexture(data, width, height);
  texture.type = cube.type;
  texture.colorSpace = cube.colorSpace;
  texture.format = cube.format;
  texture.minFilter = cube.minFilter;
  texture.magFilter = cube.magFilter;
  texture.generateMipmaps = cube.generateMipmaps;

  return texture;
};

export class HDRCubeTextureLoader extends classLoader<{
  Url: CubeUrls<string>;
  Return: CubeTexture;
  Options: Options;
  Configuration: Configuration;
}>(
  options => {
    return {
      fileLoader: FileLoader.configureAs(FileLoaderResponse.Buffer, options?.fileLoader),
      type: options?.type ?? TextureDataType.HalfFloat,
    };
  },
  async (urls, { fileLoader, type }, handlers) => {
    const buffers = await FileLoader.loadAsyncMultiple(urls, fileLoader, handlers);

    const texture = createCubeTexture(type);
    texture.images = buffers.map(buffer => createDataTexture(parse(buffer, type), texture));
    texture.needsUpdate = true;

    return texture;
  },
) {}

export namespace HDRCubeTextureLoader {
  export interface Configuration {
    fileLoader: FileLoader.Configuration<FileLoaderResponse.Buffer>;
    type: SupportedType;
  }

  export type Options = {
    fileLoader?: Omit<FileLoader.Configuration, 'responseType'>;
    type?: SupportedType;
  };
}
type Options = HDRCubeTextureLoader.Options;
type Configuration = HDRCubeTextureLoader.Configuration;
