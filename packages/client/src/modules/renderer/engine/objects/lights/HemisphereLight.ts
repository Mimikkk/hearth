import { Light } from './Light.js';
import { Color, ColorRepresentation } from '../../math/Color.js';
import { Entity } from '../../core/Entity.js';

export class HemisphereLight extends Light<undefined> {
  declare isHemisphereLight: true;
  declare type: string | 'HemisphereLight';
  groundColor: Color;

  constructor(skyColor: ColorRepresentation, groundColor: ColorRepresentation, intensity: number) {
    super(skyColor, intensity);

    this.position.from(Entity.Up);
    this.updateMatrix();

    this.groundColor = Color.new(groundColor);
  }

  copy(source: this, recursive?: boolean): this {
    super.copy(source, recursive);

    this.groundColor.from(source.groundColor);

    return this;
  }
}

HemisphereLight.prototype.isHemisphereLight = true;
HemisphereLight.prototype.type = 'HemisphereLight';
