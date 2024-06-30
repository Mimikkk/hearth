import {
  ColorSpace,
  CubeTexture,
  DataTexture,
  MagnificationTextureFilter,
  MinificationTextureFilter,
  TextureDataType,
} from '@modules/renderer/engine/engine.js';
import { parseRGBE } from '@modules/renderer/engine/loaders/textures/RGBELoader/parseRGBE.js';

const createDataTexture = ({ image: { data, width, height } }: DataTexture, cube: CubeTexture): DataTexture =>
  new DataTexture(data, width, height, {
    type: cube.type,
    colorSpace: cube.colorSpace,
    format: cube.format,
    minFilter: cube.minFilter,
    magFilter: cube.magFilter,
    generateMipmaps: cube.generateMipmaps,
  });

export type SupportedType = TextureDataType.Float | TextureDataType.HalfFloat;
export const parseHDRCubeTexture = (buffers: ArrayBuffer[], type: SupportedType): CubeTexture => {
  //@ts-expect-error - improve texture handling
  const texture = new CubeTexture();
  texture.type = type;
  texture.colorSpace = ColorSpace.LinearSRGB;
  texture.minFilter = MinificationTextureFilter.Linear;
  texture.magFilter = MagnificationTextureFilter.Linear;
  texture.generateMipmaps = false;
  texture.image = buffers.map(buffer => createDataTexture(parseRGBE(buffer, type), texture));
  texture.needsUpdate = true;

  return texture;
};
