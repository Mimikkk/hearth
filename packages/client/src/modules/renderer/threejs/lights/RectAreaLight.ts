import { Light } from './Light.js';
import { ColorRepresentation } from '@modules/renderer/threejs/math/Color.js';

export class RectAreaLight extends Light<undefined> {
  declare isRectAreaLight: true;
  declare type: string | 'RectAreaLight';

  constructor(
    color: ColorRepresentation,
    intensity: number,
    public width: number = 10,
    public height: number = 10,
  ) {
    super(color, intensity);
  }

  get power() {
    // compute the light's luminous power (in lumens) from its intensity (in nits)
    return this.intensity * this.width * this.height * Math.PI;
  }

  set power(power) {
    // set the light's intensity (in nits) from the desired luminous power (in lumens)
    this.intensity = power / (this.width * this.height * Math.PI);
  }

  copy(source: this, recursive?: boolean): this {
    super.copy(source, recursive);

    this.width = source.width;
    this.height = source.height;

    return this;
  }
}
RectAreaLight.prototype.isRectAreaLight = true;
RectAreaLight.prototype.type = 'RectAreaLight';
