import { Light } from './Light.js';
import { PointLightShadow } from './PointLightShadow.js';
import { ColorRepresentation } from '../../math/Color.js';

export class PointLight extends Light<PointLightShadow> {
  declare isPointLight: true;
  shadow: PointLightShadow;

  constructor(
    color: ColorRepresentation,
    intensity: number,
    public distance: number = 0,
    public decay: number = 2,
  ) {
    super(color, intensity);
    this.shadow = new PointLightShadow();
  }

  get power(): number {
    return this.intensity * 4 * Math.PI;
  }

  set power(power: number) {
    this.intensity = power / (4 * Math.PI);
  }
}

PointLight.prototype.isPointLight = true;
