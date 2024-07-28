import Binding from './Binding.js';
import { Texture } from '@modules/renderer/engine/objects/textures/Texture.js';

export class Sampler extends Binding {
  declare isSampler: true;

  version: number;
  constructor(
    name: string,
    public texture: Texture,
  ) {
    super(name);
    this.version = texture ? texture.version : 0;
  }
}

Sampler.prototype.isSampler = true;

export default Sampler;
