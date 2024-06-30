import { CubeTexture } from '../../../textures/CubeTexture.js';
import { ColorSpace } from '../../../constants.js';

export const parseCubeTexture = (images: HTMLImageElement[]): CubeTexture => {
  //@ts-expect-error
  const texture = new CubeTexture();
  texture.colorSpace = ColorSpace.SRGB;
  texture.image = images;
  texture.needsUpdate = true;
  return texture;
};
