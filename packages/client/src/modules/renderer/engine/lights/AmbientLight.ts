import { Light } from './Light.js';

export class AmbientLight extends Light<undefined> {
  declare isAmbientLight: true;
  declare type: string | 'AmbientLight';
}

AmbientLight.prototype.isAmbientLight = true;
AmbientLight.prototype.type = 'AmbientLight';
