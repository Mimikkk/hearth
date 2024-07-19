import { Material, MaterialParameters } from './Material.js';
import { Color, ColorRepresentation } from '../math/Color.js';

export interface ShadowMaterialParameters extends MaterialParameters {
  color?: ColorRepresentation | undefined;
  fog?: boolean | undefined;
}

export class ShadowMaterial extends Material {
  declare isShadowMaterial: true;
  declare type: string | 'ShadowMaterial';

  color: Color;
  fog: boolean;

  constructor(parameters?: ShadowMaterialParameters) {
    super(parameters);

    this.color = new Color(0x000000);
    this.transparent = true;
    this.fog = true;

    this.setValues(parameters);
  }

  setValues(values?: MaterialParameters) {
    super.setValues(values);
  }

  copy(source: this): this {
    super.copy(source);

    this.color.copy(source.color);
    this.fog = source.fog;

    return this;
  }
}
ShadowMaterial.prototype.isShadowMaterial = true;
ShadowMaterial.prototype.type = 'ShadowMaterial';
