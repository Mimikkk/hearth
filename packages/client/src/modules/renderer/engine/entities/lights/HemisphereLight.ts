import { Light } from './Light.js';
import { Color, ColorRepresentation } from '../../math/Color.js';
import { Entity } from '../../core/Entity.js';

export class HemisphereLight extends Light<undefined> {
  declare isHemisphereLight: true;
  groundColor: Color;

  constructor(skyColor: ColorRepresentation, groundColor: ColorRepresentation, intensity: number) {
    super(skyColor, intensity);

    this.position.from(Entity.Up);
    this.updateMatrix();

    this.groundColor = Color.new(groundColor);
  }
}

HemisphereLight.prototype.isHemisphereLight = true;
