import { parseRGBE } from '@modules/renderer/engine/loaders/textures/RGBELoader/parseRGBE.js';
import { DataTexture } from '@modules/renderer/engine/entities/textures/DataTexture.js';
import { CubeTexture } from '@modules/renderer/engine/entities/textures/CubeTexture.js';
import {
  ColorSpace,
  MagnificationTextureFilter,
  MinificationTextureFilter,
  TextureDataType,
} from '@modules/renderer/engine/constants.js';

const createDataTexture = ({ image: { data, width, height } }: DataTexture, cube: CubeTexture): DataTexture => {
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

export type SupportedHDRType = TextureDataType.Float | TextureDataType.HalfFloat;
export const parseHDRCubeTexture = (buffers: ArrayBuffer[], type: SupportedHDRType): CubeTexture => {
  //@ts-expect-error - improve texture handling
  const texture = new CubeTexture();
  texture.type = type;
  texture.colorSpace = ColorSpace.LinearSRGB;
  texture.minFilter = MinificationTextureFilter.Linear;
  texture.magFilter = MagnificationTextureFilter.Linear;
  texture.generateMipmaps = false;
  texture.images = buffers.map(buffer => createDataTexture(parseRGBE(buffer, type), texture));
  texture.needsUpdate = true;

  return texture;
};
