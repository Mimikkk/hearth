import { Material, MaterialParameters } from './Material.js';
import { Color, ColorRepresentation } from '../../math/Color.js';
import { Texture } from '@modules/renderer/engine/entities/textures/Texture.js';

export interface PointsMaterialParameters extends MaterialParameters {
  color?: ColorRepresentation;
  map?: Texture | null;
  alphaMap?: Texture | null;
  size?: number;
  sizeAttenuation?: boolean;
  fog?: boolean;
}

export class PointsMaterial extends Material {
  declare isPointsMaterial: true;

  color: Color;
  map: Texture | null;
  alphaMap: Texture | null;
  size: number;
  sizeAttenuation: boolean;
  fog: boolean;

  constructor(parameters?: PointsMaterialParameters) {
    super(parameters);

    this.color = Color.new(0xffffff);
    this.map = null;
    this.alphaMap = null;
    this.size = 1;
    this.sizeAttenuation = true;
    this.fog = true;
    this.setValues(parameters);
  }

  setValues(values?: PointsMaterialParameters): void {
    super.setValues(values);
  }
}

PointsMaterial.prototype.isPointsMaterial = true;
