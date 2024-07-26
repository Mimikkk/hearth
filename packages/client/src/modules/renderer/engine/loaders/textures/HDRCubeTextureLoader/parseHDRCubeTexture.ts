import {
  from,
  CubeTexture,
  DataTexture,
  MagnificationTextureFilter,
  MinificationTextureFilter,
  TextureDataType,
} from '@modules/renderer/engine/engine.js';
import { parseRGBE } from '@modules/renderer/engine/loaders/textures/RGBELoader/parseRGBE.js';

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

export type SupportedType = TextureDataType.Float | TextureDataType.HalfFloat;
export const parseHDRCubeTexture = (buffers: ArrayBuffer[], type: SupportedType): CubeTexture => {
  //@ts-expect-error - improve texture handling
  const texture = new CubeTexture();
  texture.type = type;
  texture.colorSpace = from.LinearSRGB;
  texture.minFilter = MinificationTextureFilter.Linear;
  texture.magFilter = MagnificationTextureFilter.Linear;
  texture.generateMipmaps = false;
  texture.images = buffers.map(buffer => createDataTexture(parseRGBE(buffer, type), texture));
  texture.needsUpdate = true;

  return texture;
};
