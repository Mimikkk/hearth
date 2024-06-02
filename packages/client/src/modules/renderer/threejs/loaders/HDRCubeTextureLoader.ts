import {
  ColorSpace,
  CubeTexture,
  DataTexture,
  FileLoader,
  Loader,
  MagnificationTextureFilter,
  MinificationTextureFilter,
  TextureDataType,
} from '../../threejs/Three.js';
import { RGBELoader } from './RGBELoader.js';

type Urls<T extends string> = [posx: T, negx: T, posy: T, negy: T, posz: T, negz: T];
type SupportedType = TextureDataType.Float | TextureDataType.HalfFloat;

export class HDRCubeTextureLoader<TUrl extends string = string> extends Loader {
  hdrLoader: RGBELoader;
  type: SupportedType;
  responseType: 'arraybuffer' = 'arraybuffer';

  constructor(options?: HDRCubeTextureLoader.Options) {
    super(options);

    this.hdrLoader = new RGBELoader();
    this.type = options?.type ?? TextureDataType.HalfFloat;
  }

  load(urls: Urls<TUrl>, handlers?: Loader.Handlers<CubeTexture>) {
    const texture = this.createTexture();

    let loaded = 0;
    const incrementCounter = () => ++loaded;

    for (let i = 0; i < 6; i++) {
      FileLoader.load(urls[i], this, {
        onLoad: this.createOnLoad(i, incrementCounter, texture, handlers?.onLoad),
        onProgress: handlers?.onProgress,
        onError: handlers?.onError,
      });
    }

    return texture;
  }

  createTexture() {
    //@ts-expect-error
    const texture = new CubeTexture();
    texture.type = this.type;

    switch (texture.type) {
      case TextureDataType.Float:
        texture.colorSpace = ColorSpace.LinearSRGB;
        texture.minFilter = MinificationTextureFilter.Linear;
        texture.magFilter = MagnificationTextureFilter.Linear;
        texture.generateMipmaps = false;
        break;

      case TextureDataType.HalfFloat:
        texture.colorSpace = ColorSpace.LinearSRGB;
        texture.minFilter = MinificationTextureFilter.Linear;
        texture.magFilter = MagnificationTextureFilter.Linear;
        texture.generateMipmaps = false;
        break;
    }

    return texture;
  }

  createOnLoad(
    index: number,
    incrementCounter: () => number,
    texture: CubeTexture,
    onLoad?: Loader.OnLoad<CubeTexture>,
  ) {
    return (buffer: ArrayBuffer) => {
      const loaded = incrementCounter();

      const texData = this.hdrLoader.parse(buffer);

      if (!texData) return;

      if (texData.data !== undefined) {
        //@ts-expect-error
        const dataTexture = new DataTexture(texData.data, texData.width, texData.height);

        dataTexture.type = texture.type;
        dataTexture.colorSpace = texture.colorSpace;
        dataTexture.format = texture.format;
        dataTexture.minFilter = texture.minFilter;
        dataTexture.magFilter = texture.magFilter;
        dataTexture.generateMipmaps = texture.generateMipmaps;

        texture.images[index] = dataTexture;
      }

      if (loaded === 6) {
        texture.needsUpdate = true;
        onLoad?.(texture);
      }
    };
  }
}

export namespace HDRCubeTextureLoader {
  export interface Options extends Pick<Loader.Options, 'manager' | 'path' | 'withCredentials'> {
    type?: SupportedType;
  }
}
