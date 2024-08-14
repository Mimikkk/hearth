import { Light } from './Light.js';
import { ColorRepresentation } from '@modules/renderer/engine/math/Color.js';

export class RectAreaLight extends Light<undefined> {
  declare isRectAreaLight: true;

  constructor(
    color: ColorRepresentation,
    intensity: number,
    public width: number = 10,
    public height: number = 10,
  ) {
    super(color, intensity);
  }

  get power() {
    return this.intensity * this.width * this.height * Math.PI;
  }

  set power(power) {
    this.intensity = power / (this.width * this.height * Math.PI);
  }
}

RectAreaLight.prototype.isRectAreaLight = true;
