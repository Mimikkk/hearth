import * as UTIF from 'utif';
import { DataTexture } from '@modules/renderer/engine/entities/textures/DataTexture.js';
import { MagnificationTextureFilter, MinificationTextureFilter, Wrapping } from '@modules/renderer/engine/constants.js';

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
  //@ts-expect-error - improve texture handling
  const texture = new DataTexture();
  texture.image = parse(buffer);
  texture.wrapS = Wrapping.ClampToEdge;
  texture.wrapT = Wrapping.ClampToEdge;
  texture.magFilter = MagnificationTextureFilter.Linear;
  texture.minFilter = MinificationTextureFilter.LinearMipmapLinear;
  texture.anisotropy = 1;
  texture.flipY = true;
  texture.needsUpdate = true;

  return texture;
};
