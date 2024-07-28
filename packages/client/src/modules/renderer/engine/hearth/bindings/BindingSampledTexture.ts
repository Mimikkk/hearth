import Binding from './Binding.js';
import { Texture } from '@modules/renderer/engine/entities/textures/Texture.js';
import { VideoTexture } from '@modules/renderer/engine/entities/textures/VideoTexture.js';

let id = 0;

export class BindingSampledTexture extends Binding {
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

BindingSampledTexture.prototype.isSampledTexture = true;

export class BindingSampledArrayTexture extends BindingSampledTexture {
  declare isSampledArrayTexture: true;

  constructor(name: string, texture: Texture) {
    super(name, texture);
  }
}

BindingSampledArrayTexture.prototype.isSampledArrayTexture = true;

export class Sampled3DTexture extends BindingSampledTexture {
  declare isSampled3DTexture: true;

  constructor(name: string, texture: Texture) {
    super(name, texture);
  }
}

Sampled3DTexture.prototype.isSampled3DTexture = true;

export class BindingSampledCubeTexture extends BindingSampledTexture {
  declare isSampledCubeTexture: true;

  constructor(name: string, texture: Texture) {
    super(name, texture);
  }
}

BindingSampledCubeTexture.prototype.isSampledCubeTexture = true;
