import { Light } from './Light.js';

export class AmbientLight extends Light<undefined> {
  declare isAmbientLight: true;
}

AmbientLight.prototype.isAmbientLight = true;
