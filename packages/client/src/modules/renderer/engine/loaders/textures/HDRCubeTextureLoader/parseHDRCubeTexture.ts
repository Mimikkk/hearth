import { parseRGBE } from '@modules/renderer/engine/loaders/textures/RGBELoader/parseRGBE.js';
import { DataTexture } from '@modules/renderer/engine/entities/textures/DataTexture.js';
import { CubeTexture } from '@modules/renderer/engine/entities/textures/CubeTexture.js';
import { ColorSpace, TextureDataType } from '@modules/renderer/engine/constants.js';
import { GPUFilterModeType } from '@modules/renderer/engine/hearth/constants.js';

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
