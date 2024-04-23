import { Color, ColorRepresentation } from '../math/Color.js';

export class Fog {
  declare isFog: true;
  name: string;
  color: Color;

  constructor(
    color: ColorRepresentation,
    public near: number = 1,
    public far: number = 1000,
  ) {
    this.name = '';
    this.color = new Color(color);
  }

  clone(): Fog {
    return new Fog(this.color, this.near, this.far);
  }

  toJSON() {
    return {
      type: 'Fog',
      name: this.name,
      color: this.color.getHex(),
      near: this.near,
      far: this.far,
    };
  }
}
Fog.prototype.isFog = true;
