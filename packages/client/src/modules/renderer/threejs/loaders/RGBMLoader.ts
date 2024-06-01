import {
  CubeTexture,
  DataTextureLoader,
  DataUtils,
  Filter,
  TextureDataType,
  TextureFormat,
} from '../../threejs/Three.js';
import * as UPNG from 'upng-js';

export class RGBMLoader extends DataTextureLoader {
  constructor(options) {
    super(options);

    this.type = TextureDataType.HalfFloat;
    // more information about this property at https://iwasbeingirony.blogspot.com/2010/06/difference-between-rgbm-and-rgbd.html
    this.maxRange = 7;
  }

  setDataType(value) {
    this.type = value;
    return this;
  }

  setMaxRange(value) {
    this.maxRange = value;
    return this;
  }

  loadCubemap(urls, onLoad, onProgress, onError) {
    const texture = new CubeTexture();

    let loaded = 0;

    const scope = this;

    function loadTexture(i) {
      scope.load(urls[i], {
        onLoad: function (image) {
          texture.images[i] = image;

          loaded++;

          if (loaded === 6) {
            texture.needsUpdate = true;

            if (onLoad) onLoad(texture);
          }
        },
        onProgress: undefined,
        onError,
      });
    }

    for (let i = 0; i < urls.length; ++i) {
      loadTexture(i);
    }

    texture.type = this.type;
    texture.format = TextureFormat.RGBA;
    texture.minFilter = Filter.Linear;
    texture.generateMipmaps = false;

    return texture;
  }

  parse(buffer) {
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
