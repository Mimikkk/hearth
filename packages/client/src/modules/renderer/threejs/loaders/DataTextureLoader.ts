import { Filter, MinificationTextureFilter, Wrapping } from '../constants.js';
import { FileLoader } from './FileLoader.js';
import { DataTexture } from '../textures/DataTexture.js';
import { Loader } from './Loader.js';

/**
 * Abstract Base class to load generic binary textures formats (rgbe, hdr, ...)
 *
 * Sub classes have to implement the parse() method which will be used in load().
 */

export class DataTextureLoader<TUrl extends string = string> extends Loader {
  responseType: 'arraybuffer' = 'arraybuffer';

  constructor(options?: DataTextureLoader.Options) {
    super(options);
  }

  load(url: TUrl, handlers?: Loader.Handlers<[texture: DataTexture, data: any]>): DataTexture {
    //@ts-expect-error
    const texture = new DataTexture();

    FileLoader.load(url, this, {
      onLoad: this.createOnLoad(texture, handlers?.onLoad, handlers?.onError),
      onProgress: handlers?.onProgress,
      onError: handlers?.onError,
    });

    return texture;
  }

  createOnLoad(
    texture: DataTexture,
    onLoad: undefined | Loader.OnLoad<[texture: DataTexture, data: any]>,
    onError: Loader.OnError = console.error,
  ) {
    return (buffer: ArrayBuffer) => {
      let texData: any;

      try {
        texData = this.parse(buffer);
      } catch (error) {
        onError(error);
      }

      if (texData.image !== undefined) {
        texture.image = texData.image;
      } else if (texData.data !== undefined) {
        texture.image.width = texData.width;
        texture.image.height = texData.height;
        texture.image.data = texData.data;
      }

      texture.wrapS = texData.wrapS !== undefined ? texData.wrapS : Wrapping.ClampToEdge;
      texture.wrapT = texData.wrapT !== undefined ? texData.wrapT : Wrapping.ClampToEdge;

      texture.magFilter = texData.magFilter !== undefined ? texData.magFilter : Filter.Linear;
      texture.minFilter = texData.minFilter !== undefined ? texData.minFilter : Filter.Linear;

      texture.anisotropy = texData.anisotropy !== undefined ? texData.anisotropy : 1;

      if (texData.colorSpace !== undefined) {
        texture.colorSpace = texData.colorSpace;
      }

      if (texData.flipY !== undefined) {
        texture.flipY = texData.flipY;
      }

      if (texData.format !== undefined) {
        texture.format = texData.format;
      }

      if (texData.type !== undefined) {
        texture.type = texData.type;
      }

      if (texData.mipmaps !== undefined) {
        texture.mipmaps = texData.mipmaps;
        texture.minFilter = MinificationTextureFilter.LinearMipmapLinear;
      }

      if (texData.mipmapCount === 1) {
        texture.minFilter = MinificationTextureFilter.Linear;
      }

      if (texData.generateMipmaps !== undefined) {
        texture.generateMipmaps = texData.generateMipmaps;
      }

      texture.needsUpdate = true;

      onLoad?.([texture, texData]);
    };
  }
}

export namespace DataTextureLoader {
  export interface Options extends Pick<Loader.Options, 'manager' | 'path' | 'requestHeader' | 'withCredentials'> {}
}
