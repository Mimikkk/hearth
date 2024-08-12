import { CubeTexture } from '@modules/renderer/engine/entities/textures/CubeTexture.js';
import { ColorSpace } from '../../../constants.js';

export const parseCubeTexture = (images: HTMLImageElement[]): CubeTexture =>
  new CubeTexture({
    images,
    colorSpace: ColorSpace.SRGB,
    useUpdate: true,
  });
