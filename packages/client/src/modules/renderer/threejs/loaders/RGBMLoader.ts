import {
  CubeTexture,
  DataTexture,
  DataTextureLoader,
  DataUtils,
  ImageLoader,
  Loader,
  MinificationTextureFilter,
  TextureDataType,
  TextureFormat,
} from '../../threejs/Three.js';
import * as UPNG from 'upng-js';

type Urls<T extends string> = [posx: T, negx: T, posy: T, negy: T, posz: T, negz: T];

export class RGBMLoader<TUrl extends string = string> extends DataTextureLoader {
  type: RGBMLoader.SupportedType;
  maxRange: number;

  constructor(options?: RGBMLoader.Options) {
    super(options);
    this.type = options?.type ?? TextureDataType.HalfFloat;
    this.maxRange = options?.maxRange ?? 7;
  }

  load(urls: Urls<TUrl>, handlers?: ImageLoader.Handlers<CubeTexture>) {
    //@ts-expect-error
    const texture = new CubeTexture();

    let loaded = 0;
    const incrementCounter = () => ++loaded;

    for (let i = 0; i < urls.length; ++i) {
      super.load(urls[i], {
        onLoad: this.createOnLoad2(i, texture, incrementCounter, handlers?.onLoad),
        onError: handlers?.onError,
      });
    }

    texture.type = this.type;
    texture.format = TextureFormat.RGBA;
    texture.minFilter = MinificationTextureFilter.Linear;
    texture.generateMipmaps = false;

    return texture;
  }

  createOnLoad2(
    index: number,
    texture: CubeTexture,
    incrementCounter: () => number,
    onLoad: undefined | Loader.OnLoad<CubeTexture>,
  ) {
    return ([image]: [DataTexture, any]) => {
      texture.images[index] = image;

      if (incrementCounter() === 6) {
        texture.needsUpdate = true;

        onLoad?.(texture);
      }
    };
  }

  parse(buffer: ArrayBuffer) {
    const img = UPNG.decode(buffer);
    const rgba = UPNG.toRGBA8(img)[0];

    const data = new Uint8Array(rgba);
    const size = img.width * img.height * 4;

    const output = this.type === TextureDataType.HalfFloat ? new Uint16Array(size) : new Float32Array(size);

    // decode RGBM

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i + 0] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;
      const a = data[i + 3] / 255;

      if (this.type === TextureDataType.HalfFloat) {
        output[i + 0] = DataUtils.toHalfFloat(Math.min(r * a * this.maxRange, 65504));
        output[i + 1] = DataUtils.toHalfFloat(Math.min(g * a * this.maxRange, 65504));
        output[i + 2] = DataUtils.toHalfFloat(Math.min(b * a * this.maxRange, 65504));
        output[i + 3] = DataUtils.toHalfFloat(1);
      } else {
        output[i + 0] = r * a * this.maxRange;
        output[i + 1] = g * a * this.maxRange;
        output[i + 2] = b * a * this.maxRange;
        output[i + 3] = 1;
      }
    }

    return {
      width: img.width,
      height: img.height,
      data: output,
      format: TextureFormat.RGBA,
      type: this.type,
      flipY: true,
    };
  }
}

export namespace RGBMLoader {
  export interface Options extends DataTextureLoader.Options {
    type?: SupportedType;
    maxRange?: number;
  }

  export type SupportedType = TextureDataType.HalfFloat | TextureDataType.Float;
}
