import { Binding } from './Binding.js';
import { Texture } from '@modules/renderer/engine/entities/textures/Texture.js';

export class BindingSampler extends Binding {
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

BindingSampler.prototype.isSampler = true;
