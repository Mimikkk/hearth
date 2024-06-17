import {
  DataTexture,
  MagnificationTextureFilter,
  MinificationTextureFilter,
  Wrapping,
} from '@modules/renderer/engine/engine.js';

import * as UTIF from 'utif';
import { classLoader } from '@modules/renderer/engine/loaders/types.js';
import { FileLoader, FileLoaderResponse } from '@modules/renderer/engine/loaders/FileLoader.js';

interface ParseResult {
  data: Uint8Array;
  width: number;
  height: number;
  flipY: boolean;
  magFilter: MagnificationTextureFilter;
  minFilter: MinificationTextureFilter;
}

const parseTiff = (buffer: ArrayBuffer): ParseResult => {
  const [ifds] = UTIF.decode(buffer);
  UTIF.decodeImage(buffer, ifds);
  const data = UTIF.toRGBA8(ifds);

  return {
    data,
    width: ifds.width,
    height: ifds.height,
    flipY: true,
    magFilter: MagnificationTextureFilter.Linear,
    minFilter: MinificationTextureFilter.LinearMipmapLinear,
  };
};

const createDataTexture = (details: ParseResult) => {
  //@ts-expect-error - improve texture handling
  const texture = new DataTexture();
  texture.image.width = details.width;
  texture.image.height = details.height;
  texture.image.data = details.data;
  texture.wrapS = Wrapping.ClampToEdge;
  texture.wrapT = Wrapping.ClampToEdge;
  texture.magFilter = details.magFilter;
  texture.minFilter = details.minFilter;
  texture.anisotropy = 1;
  texture.flipY = details.flipY;
  texture.needsUpdate = true;

  return texture;
};

export class TiffLoader extends classLoader<{
  Url: string;
  Return: DataTexture;
  Options: Options;
  Configuration: Configuration;
}>(
  options => ({
    fileLoader: FileLoader.configureAs(FileLoaderResponse.Buffer, options?.fileLoader),
    maxRange: options?.maxRange ?? 16,
  }),
  async (url, configuration, handlers) => {
    const buffer = await FileLoader.loadAsync(url, configuration.fileLoader, handlers);

    return createDataTexture(parseTiff(buffer));
  },
) {}

export namespace TiffLoader {
  export interface Options {
    fileLoader?: Omit<FileLoader.Configuration, 'responseType'>;
    maxRange?: number;
  }

  export interface Configuration {
    fileLoader: FileLoader.Configuration<FileLoaderResponse.Buffer>;
    maxRange: number;
  }
}

type Options = TiffLoader.Options;
type Configuration = TiffLoader.Configuration;
