import * as UTIF from 'utif';
import { DataTexture } from '@modules/renderer/engine/entities/textures/DataTexture.js';
import { GPUAddressModeType, GPUFilterModeType } from '@modules/renderer/engine/hearth/constants.js';

interface ParseResult {
  data: Uint8Array;
  width: number;
  height: number;
}

const parse = (buffer: ArrayBuffer): ParseResult => {
  const [ifds] = UTIF.decode(buffer);
  UTIF.decodeImage(buffer, ifds);
  const data = UTIF.toRGBA8(ifds);

  return { data, width: ifds.width, height: ifds.height };
};

export const parseTiff = (buffer: ArrayBuffer): DataTexture => {
  const image = parse(buffer);

  return new DataTexture({
    data: image.data,
    width: image.width,
    height: image.height,
    wrapS: GPUAddressModeType.ClampToEdge,
    wrapT: GPUAddressModeType.ClampToEdge,
    minFilter: GPUFilterModeType.Linear,
    magFilter: GPUFilterModeType.Linear,
    anisotropy: 1,
    flipY: true,
    useUpdate: true,
  });
};
