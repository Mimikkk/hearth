import { Material, type MaterialParameters } from './Material.js';
import { Color, type ColorRepresentation } from '../../math/Color.js';
import type { Texture } from '../textures/Texture.js';

export interface LineBasicMaterialParameters extends MaterialParameters {
  color?: ColorRepresentation;
  fog?: boolean;
  linewidth?: number;
  linecap?: string;
  linejoin?: string;
}

export class LineBasicMaterial extends Material {
  color: Color;
  fog: boolean;
  linewidth: number;
  linecap: 'round' | 'butt' | 'square';
  linejoin: 'round' | 'bevel' | 'miter';
  map: Texture | null;

  constructor(parameters?: LineBasicMaterialParameters) {
    super(parameters);

    this.color = Color.new(0xffffff);

    this.map = null;

    this.linewidth = 1;
    this.linecap = 'round';
    this.linejoin = 'round';

    this.fog = true;
    this.setValues(parameters);
  }

  setValues(values?: LineBasicMaterialParameters): void {
    super.setValues(values);
  }
}
