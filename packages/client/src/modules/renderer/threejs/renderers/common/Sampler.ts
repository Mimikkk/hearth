import Binding from './Binding.js';
import { Texture } from '@modules/renderer/threejs/textures/Texture.js';

export class Sampler extends Binding {
  declare isSampler: true;

  texture: Texture;
  version: number;

  constructor(name: string, texture: Texture) {
    super(name);

    this.texture = texture;
    this.version = texture ? texture.version : 0;
  }
}

Sampler.prototype.isSampler = true;

export default Sampler;
