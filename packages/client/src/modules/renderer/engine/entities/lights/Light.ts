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

  copy(source: this, recursive?: boolean): this {
    super.copy(source, recursive);

    this.color.from(source.color);
    this.intensity = source.intensity;

    return this;
  }
}

Light.prototype.isLight = true;
