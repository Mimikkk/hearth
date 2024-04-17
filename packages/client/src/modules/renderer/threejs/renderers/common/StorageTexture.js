import { Filter, Texture } from '../../../threejs/Three.js';

class StorageTexture extends Texture {
  constructor(width = 1, height = 1) {
    super();

    this.image = { width, height };

    this.magFilter = Filter.Linear;
    this.minFilter = Filter.Linear;

    this.isStorageTexture = true;
  }
}

export default StorageTexture;
