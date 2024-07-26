import { CubeTexture } from '@modules/renderer/engine/objects/textures/CubeTexture.js';
import { from } from '../../../constants.js';

export const parseCubeTexture = (images: HTMLImageElement[]): CubeTexture => {
  //@ts-expect-error
  const texture = new CubeTexture();
  texture.colorSpace = from.SRGB;
  texture.images = images;
  texture.needsUpdate = true;
  return texture;
};
