import * as upng from 'upng-js';
import {
  MagnificationTextureFilter,
  MinificationTextureFilter,
  TextureDataType,
  TextureFormat,
  Wrapping,
} from '@modules/renderer/engine/constants.js';
import { DataUtils } from '@modules/renderer/engine/utils/DataUtils.js';
import { DataTexture } from '@modules/renderer/engine/entities/textures/DataTexture.js';
import { CubeTexture } from '@modules/renderer/engine/entities/textures/CubeTexture.js';

export type SupportedRGBMType = TextureDataType.HalfFloat | TextureDataType.Float;

const parseBuffer = (buffer: ArrayBuffer, type: SupportedRGBMType, maxRange: number): ParseResult => {
  const img = upng.decode(buffer);
  const rgba = upng.toRGBA8(img)[0];

  const data = new Uint8Array(rgba);
  const size = img.width * img.height * 4;

  const output = type === TextureDataType.HalfFloat ? new Uint16Array(size) : new Float32Array(size);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;
    const a = data[i + 3] / 255;

    if (type === TextureDataType.HalfFloat) {
      output[i] = DataUtils.toHalfFloat(Math.min(r * a * maxRange, 65504));
      output[i + 1] = DataUtils.toHalfFloat(Math.min(g * a * maxRange, 65504));
      output[i + 2] = DataUtils.toHalfFloat(Math.min(b * a * maxRange, 65504));
      output[i + 3] = DataUtils.toHalfFloat(1);
    } else {
      output[i] = r * a * maxRange;
      output[i + 1] = g * a * maxRange;
      output[i + 2] = b * a * maxRange;
      output[i + 3] = 1;
    }
  }

  return {
    width: img.width,
    height: img.height,
    data: output,
    format: TextureFormat.RGBA,
    type: type,
    flipY: true,
  };
};

interface ParseResult {
  data: Uint16Array | Float32Array;
  width: number;
  height: number;
  format: TextureFormat;
  type: TextureDataType;
  flipY: boolean;
}

const parseDataTexture = (buffer: ArrayBuffer, type: SupportedRGBMType, maxRange: number) => {
  //@ts-expect-error
  const texture = new DataTexture();
  texture.wrapS = Wrapping.ClampToEdge;
  texture.wrapT = Wrapping.ClampToEdge;
  texture.magFilter = MagnificationTextureFilter.Linear;
  texture.minFilter = MinificationTextureFilter.Linear;
  texture.anisotropy = 1;

  const details = parseBuffer(buffer, type, maxRange);
  texture.image.width = details.width;
  texture.image.height = details.height;
  texture.image.data = details.data;
  texture.flipY = details.flipY;
  texture.format = details.format;
  texture.type = details.type;
  texture.needsUpdate = true;

  return texture;
};
export const parseRGBM = (buffers: ArrayBuffer[], type: SupportedRGBMType, maxRange: number): CubeTexture => {
  //@ts-expect-error - improve texture handling
  const texture = new CubeTexture();
  texture.images = buffers.map(buffer => parseDataTexture(buffer, type, maxRange));
  texture.type = type;
  texture.format = TextureFormat.RGBA;
  texture.minFilter = MinificationTextureFilter.Linear;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;

  return texture;
};
