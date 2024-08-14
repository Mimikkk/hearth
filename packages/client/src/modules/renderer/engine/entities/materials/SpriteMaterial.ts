import { Material, MaterialParameters } from './Material.js';
import { Color, ColorRepresentation } from '../../math/Color.js';
import { Texture } from '@modules/renderer/engine/entities/textures/Texture.js';

export interface SpriteMaterialParameters extends MaterialParameters {
  color?: ColorRepresentation;
  map?: Texture | null;
  alphaMap?: Texture | null;
  rotation?: number;
  sizeAttenuation?: boolean;
  fog?: boolean;
}

export class SpriteMaterial extends Material {
  declare isSpriteMaterial: true;

  color: Color;
  map: Texture | null;
  alphaMap: Texture | null;
  rotation: number;
  sizeAttenuation: boolean;
  transparent: boolean;
  fog: boolean;

  constructor(parameters?: SpriteMaterialParameters) {
    super(parameters);

    this.color = Color.new(0xffffff);

    this.map = null;

    this.alphaMap = null;

    this.rotation = 0;

    this.sizeAttenuation = true;

    this.transparent = true;

    this.fog = true;

    this.setValues(parameters);
  }

  setValues(parameters?: SpriteMaterialParameters): void {
    super.setValues(parameters);
  }
}

SpriteMaterial.prototype.isSpriteMaterial = true;
