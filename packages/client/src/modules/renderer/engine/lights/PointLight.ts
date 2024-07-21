import { Light } from './Light.js';
import { PointLightShadow } from './PointLightShadow.js';
import { ColorRepresentation } from '../math/Color.js';

export class PointLight extends Light<PointLightShadow> {
  declare isPointLight: true;
  declare type: string | 'PointLight';
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
    // compute the light's luminous power (in lumens) from its intensity (in candela)
    // for an isotropic light source, luminous power (lm) = 4 π luminous intensity (cd)
    return this.intensity * 4 * Math.PI;
  }

  set power(power: number) {
    // set the light's intensity (in candela) from the desired luminous power (in lumens)
    this.intensity = power / (4 * Math.PI);
  }

  copy(source: this, recursive?: boolean): this {
    super.copy(source, recursive);

    this.distance = source.distance;
    this.decay = source.decay;

    this.shadow = source.shadow.clone();

    return this;
  }
}
PointLight.prototype.isPointLight = true;
PointLight.prototype.type = 'PointLight';
