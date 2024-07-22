import { Material, MaterialParameters } from './Material.js';
import { Color, ColorRepresentation } from '../math/Color.js';
import { Texture } from '@modules/renderer/engine/textures/Texture.js';

export interface PointsMaterialParameters extends MaterialParameters {
  color?: ColorRepresentation | undefined;
  map?: Texture | null | undefined;
  alphaMap?: Texture | null | undefined;
  size?: number | undefined;
  sizeAttenuation?: boolean | undefined;
  fog?: boolean | undefined;
}

export class PointsMaterial extends Material {
  declare isPointsMaterial: true;
  declare type: string | 'PointsMaterial';

  color: Color;
  map: Texture | null;
  alphaMap: Texture | null;
  size: number;
  sizeAttenuation: boolean;
  fog: boolean;

  constructor(parameters: PointsMaterialParameters) {
    super(parameters);

    this.color = new Color(0xffffff);
    this.map = null;
    this.alphaMap = null;
    this.size = 1;
    this.sizeAttenuation = true;
    this.fog = true;
    this.setValues(parameters);
  }

  setValues(values: PointsMaterialParameters): void {
    super.setValues(values);
  }

  copy(source: this): this {
    super.copy(source);

    this.color.from(source.color);
    this.map = source.map;
    this.alphaMap = source.alphaMap;
    this.size = source.size;
    this.sizeAttenuation = source.sizeAttenuation;
    this.fog = source.fog;

    return this;
  }
}

PointsMaterial.prototype.isPointsMaterial = true;
PointsMaterial.prototype.type = 'PointsMaterial';
