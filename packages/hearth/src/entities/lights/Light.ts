import { Entity } from '../../core/Entity.js';
import { Color, ColorRepresentation } from '../../math/Color.js';
import { LightShadow } from './LightShadow.js';

export class Light<S extends LightShadow | undefined = any> extends Entity {
  declare isLight: true;

  color: Color;
  intensity: number;
  shadow: S;

  constructor(color: ColorRepresentation, intensity: number = 1) {
    super();

    this.color = Color.new(color);
    this.intensity = intensity;
  }
}

Light.prototype.isLight = true;
