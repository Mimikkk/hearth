import {
  ColorSpace,
  CubeTexture,
  DataTexture,
  MagnificationTextureFilter,
  MinificationTextureFilter,
  TextureDataType,
} from '@modules/renderer/engine/engine.js';
import { parse, ParseResult } from '../RGBELoader/RGBELoader.js';

const createDataTexture = ({ data, width, height }: ParseResult, cube: CubeTexture): DataTexture => {
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
  texture.colorSpace = ColorSpace.LinearSRGB;
  texture.minFilter = MinificationTextureFilter.Linear;
  texture.magFilter = MagnificationTextureFilter.Linear;
  texture.generateMipmaps = false;

  texture.images = buffers.map(buffer => createDataTexture(parse(buffer, type), texture));
  texture.needsUpdate = true;

  return texture;
};
