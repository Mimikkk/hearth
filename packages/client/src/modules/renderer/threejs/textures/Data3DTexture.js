import { Texture } from './Texture.js';
import { Filter, Wrapping } from '../constants.ts';

class Data3DTexture extends Texture {
  constructor(data = null, width = 1, height = 1, depth = 1) {
    // We're going to add .setXXX() methods for setting properties later.
    // Users can still set in DataTexture3D directly.
    //
    //	const texture = new THREE.DataTexture3D( data, width, height, depth );
    // 	texture.anisotropy = 16;
    //
    // See #14839

    super(null);

    this.isData3DTexture = true;

    this.image = { data, width, height, depth };

    this.magFilter = Filter.Nearest;
    this.minFilter = Filter.Nearest;

    this.wrapR = Wrapping.ClampToEdge;

    this.generateMipmaps = false;
    this.flipY = false;
    this.unpackAlignment = 1;
  }
}

export { Data3DTexture };
