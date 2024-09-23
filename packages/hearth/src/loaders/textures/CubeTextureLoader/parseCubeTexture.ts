import { ColorSpace } from '../../../constants.js';
import { CubeTexture } from '../../../entities/textures/CubeTexture.js';

export const parseCubeTexture = (images: HTMLImageElement[]): CubeTexture =>
  new CubeTexture({
    images,
    colorSpace: ColorSpace.SRGB,
    useUpdate: true,
  });
