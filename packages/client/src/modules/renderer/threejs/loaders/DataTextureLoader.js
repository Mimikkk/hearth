import { Filter, Wrapping } from '../constants.ts';
import { FileLoader } from './FileLoader.ts';
import { DataTexture } from '../textures/DataTexture.ts';
import { Loader } from './Loader.ts';

/**
 * Abstract Base class to load generic binary textures formats (rgbe, hdr, ...)
 *
 * Sub classes have to implement the parse() method which will be used in load().
 */

class DataTextureLoader extends Loader {
  constructor(manager) {
    super(manager);
  }

  load(url, { onLoad, onProgress, onError }) {
    const scope = this;

    const texture = new DataTexture();

    const loader = new FileLoader({
      manager: this.manager,
      responseType: 'arraybuffer',
      path: this.path,
      requestHeader: this.requestHeader,
      withCredentials: this.withCredentials,
    });
    loader.load(url, {
      onLoad: function (buffer) {
        let texData;

        try {
          texData = scope.parse(buffer);
        } catch (error) {
          if (onError !== undefined) {
            onError(error);
          } else {
            console.error(error);
            return;
          }
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
          texture.minFilter = Filter.LinearMipmapLinear; // presumably...
        }

        if (texData.mipmapCount === 1) {
          texture.minFilter = Filter.Linear;
        }

        if (texData.generateMipmaps !== undefined) {
          texture.generateMipmaps = texData.generateMipmaps;
        }

        texture.needsUpdate = true;

        if (onLoad) onLoad(texture, texData);
      },
      onProgress,
      onError,
    });

    return texture;
  }
}

export { DataTextureLoader };
