import { Material, type MaterialParameters } from './Material.js';
import { Color, type ColorRepresentation } from '../math/Color.js';
import type { Texture } from '../textures/Texture.js';

export interface LineBasicMaterialParameters extends MaterialParameters {
  color?: ColorRepresentation | undefined;
  fog?: boolean | undefined;
  linewidth?: number | undefined;
  linecap?: string | undefined;
  linejoin?: string | undefined;
}

export class LineBasicMaterial extends Material {
  declare isLineBasicMaterial: true;
  declare type: string;
  color: Color;
  fog: boolean;
  linewidth: number;
  linecap: 'round' | 'butt' | 'square';
  linejoin: 'round' | 'bevel' | 'miter';
  map: Texture | null;

  constructor(parameters: LineBasicMaterialParameters) {
    super(parameters);

    this.color = new Color(0xffffff);

    this.map = null;

    this.linewidth = 1;
    this.linecap = 'round';
    this.linejoin = 'round';

    this.fog = true;
    this.setValues(parameters);
  }

  setValues(values: LineBasicMaterialParameters): void {
    super.setValues(values);
  }

  copy(source: this): this {
    super.copy(source);
    this.color.copy(source.color);
    this.map = source.map;
    this.linewidth = source.linewidth;
    this.linecap = source.linecap;
    this.linejoin = source.linejoin;
    this.fog = source.fog;
    return this;
  }
}

LineBasicMaterial.prototype.isLineBasicMaterial = true;
LineBasicMaterial.prototype.type = 'LineBasicMaterial';
