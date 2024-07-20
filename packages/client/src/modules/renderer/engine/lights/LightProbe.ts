import { SphericalHarmonics3 } from '../math/SphericalHarmonics3.js';
import { Light } from './Light.js';

export class LightProbe extends Light<undefined> {
  declare isLightProbe: true;
  declare type: string | 'LightProbe';

  constructor(
    public sphericalHarmonics: SphericalHarmonics3 = new SphericalHarmonics3(),
    intensity = 1,
  ) {
    super(undefined!, intensity);
  }

  copy(source: this, recursive?: boolean): this {
    super.copy(source, recursive);

    this.sphericalHarmonics.copy(source.sphericalHarmonics);

    return this;
  }
}
LightProbe.prototype.isLightProbe = true;
LightProbe.prototype.type = 'LightProbe';
