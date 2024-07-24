import Binding from './Binding.js';
import { Texture } from '@modules/renderer/engine/objects/textures/Texture.js';
import { VideoTexture } from '@modules/renderer/engine/objects/textures/VideoTexture.js';

let id = 0;

export class SampledTexture extends Binding {
  declare isSampledTexture: true;
  texture: Texture;
  version: number;
  store: boolean;
  id: number;

  constructor(name: string, texture: Texture) {
    super(name);

    this.id = id++;
    this.texture = texture;
    this.version = texture ? texture.version : 0;
    this.store = false;

    this.isSampledTexture = true;
  }

  get needsBindingsUpdate() {
    const { texture, version } = this;

    return texture instanceof VideoTexture ? true : version !== texture.version;
  }

  update() {
    const { texture, version } = this;

    if (version !== texture.version) {
      this.version = texture.version;

      return true;
    }

    return false;
  }
}

SampledTexture.prototype.isSampledTexture = true;

export class SampledArrayTexture extends SampledTexture {
  declare isSampledArrayTexture: true;

  constructor(name: string, texture: Texture) {
    super(name, texture);
  }
}

SampledArrayTexture.prototype.isSampledArrayTexture = true;

export class Sampled3DTexture extends SampledTexture {
  declare isSampled3DTexture: true;

  constructor(name: string, texture: Texture) {
    super(name, texture);
  }
}

Sampled3DTexture.prototype.isSampled3DTexture = true;

export class SampledCubeTexture extends SampledTexture {
  declare isSampledCubeTexture: true;

  constructor(name: string, texture: Texture) {
    super(name, texture);
  }
}

SampledCubeTexture.prototype.isSampledCubeTexture = true;
