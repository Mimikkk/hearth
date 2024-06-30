import { Material, MaterialParameters } from './Material.js';
import { Color, ColorRepresentation } from '../math/Color.js';
import { Texture } from '@modules/renderer/engine/textures/Texture.js';

export interface SpriteMaterialParameters extends MaterialParameters {
  color?: ColorRepresentation | undefined;
  map?: Texture | null | undefined;
  alphaMap?: Texture | null | undefined;
  rotation?: number | undefined;
  sizeAttenuation?: boolean | undefined;
  fog?: boolean | undefined;
}

export class SpriteMaterial extends Material {
  color: Color;
  map: Texture | null;
  alphaMap: Texture | null;
  rotation: number;
  sizeAttenuation: boolean;
  transparent: boolean;
  fog: boolean;

  constructor(parameters: SpriteMaterialParameters) {
    super(parameters);

    this.color = new Color(0xffffff);

    this.map = null;

    this.alphaMap = null;

    this.rotation = 0;

    this.sizeAttenuation = true;

    this.transparent = true;

    this.fog = true;

    this.setValues(parameters);
  }

  setValues(parameters: SpriteMaterialParameters): void {
    super.setValues(parameters);
  }

  copy(source: this): this {
    super.copy(source);

    this.color.copy(source.color);

    this.map = source.map;

    this.alphaMap = source.alphaMap;

    this.rotation = source.rotation;

    this.sizeAttenuation = source.sizeAttenuation;

    this.fog = source.fog;

    return this;
  }
}
