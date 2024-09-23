import { DataTexture } from '../../../entities/textures/DataTexture.js';
import { CubeTexture } from '../../../entities/textures/CubeTexture.js';
import { ColorSpace, TextureDataType } from '../../../constants.js';
import { GPUFilterModeType } from '../../../hearth/constants.js';
import { parseRGBE } from '../RGBELoader/parseRGBE.js';

const createDataTexture = ({ image: { data, width, height } }: DataTexture, cube: CubeTexture): DataTexture =>
  new DataTexture({
    data,
    width,
    height,
    type: cube.type,
    colorSpace: cube.colorSpace,
    format: cube.format,
    minFilter: cube.minFilter,
    magFilter: cube.magFilter,
    useMipmap: cube.useMipmap,
  });

export type SupportedHDRType = TextureDataType.Float | TextureDataType.HalfFloat;
export const parseHDRCubeTexture = (buffers: ArrayBuffer[], type: SupportedHDRType): CubeTexture => {
  const texture = new CubeTexture({
    type,
    colorSpace: ColorSpace.LinearSRGB,
    minFilter: GPUFilterModeType.Linear,
    magFilter: GPUFilterModeType.Linear,
    useMipmap: false,
    useUpdate: true,
  });
  texture.images = buffers.map(buffer => createDataTexture(parseRGBE(buffer, type), texture));

  return texture;
};
