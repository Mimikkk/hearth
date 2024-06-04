import {
  ColorSpace,
  CubeTexture,
  DataTexture,
  MagnificationTextureFilter,
  MinificationTextureFilter,
  TextureDataType,
} from '../../threejs/Three.js';
import { RGBELoader } from './RGBELoader.js';
import { FileLoader } from '@modules/renderer/threejs/loaders/FileLoader.js';
import type { IConfigurable, IConfigurableConstructor, LoaderAsync } from './types.js';

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
const createDataTexture = ({ data, width, height }: RGBELoader.Result, cube: CubeTexture): DataTexture => {
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

export const HDRCubeTextureLoader = class<TUrl extends CubeUrls<string>>
  implements LoaderAsync<CubeTexture, TUrl>, IConfigurable<Configuration>
{
  static configure(options?: HDRCubeTextureLoader.Options): HDRCubeTextureLoader.Configuration {
    return {
      type: options?.type ?? TextureDataType.HalfFloat,
      credentials: options?.credentials ?? 'same-origin',
      headers: options?.headers,
      responseType: 'arraybuffer',
    };
  }

  configuration: HDRCubeTextureLoader.Configuration;
  hdr: RGBELoader;

  constructor(options?: HDRCubeTextureLoader.Options) {
    this.configuration = HDRCubeTextureLoader.configure(options);
    this.hdr = new RGBELoader();
  }

  async loadAsync<T extends CubeTexture>(urls: TUrl, handlers?: LoaderAsync.Handlers): Promise<T> {
    const loader = new FileLoader(this.configuration);

    const texture = createCubeTexture(this.configuration.type) as T;
    texture.images = await Promise.all(
      urls.map(async url => {
        const buffer = await loader.loadAsync(url, handlers);
        const result = this.hdr.parse(buffer);

        return createDataTexture(result, texture);
      }),
    );
    texture.needsUpdate = true;

    return texture;
  }
} satisfies IConfigurableConstructor<Options, Configuration>;

export namespace HDRCubeTextureLoader {
  export interface Configuration extends Pick<FileLoader.Configuration, 'credentials' | 'headers'> {
    type: SupportedType;
    responseType: 'arraybuffer';
  }

  export type Options = Omit<Configuration, 'responseType'>;
}
type Options = HDRCubeTextureLoader.Options;
type Configuration = HDRCubeTextureLoader.Configuration;
