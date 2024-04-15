import { Texture } from './Texture.js';
import { Mapping } from '../constants.ts';

class CubeTexture extends Texture {
  constructor(images, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy, colorSpace) {
    images = images !== undefined ? images : [];
    mapping = mapping !== undefined ? mapping : Mapping.CubeReflection;

    super(images, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy, colorSpace);

    this.isCubeTexture = true;

    this.flipY = false;
  }

  get images() {
    return this.image;
  }

  set images(value) {
    this.image = value;
  }
}

export { CubeTexture };
