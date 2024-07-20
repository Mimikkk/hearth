import { Light } from './Light.js';
import { DirectionalLightShadow } from './DirectionalLightShadow.js';
import { Object3D } from '../core/Object3D.js';
import { ColorRepresentation } from '@modules/renderer/engine/math/Color.js';

export class DirectionalLight extends Light<DirectionalLightShadow> {
  declare isDirectionalLight: true;
  declare type: string | 'DirectionalLight';
  target: Object3D;
  shadow: DirectionalLightShadow;

  constructor(color: ColorRepresentation, intensity: number) {
    super(color, intensity);

    this.position.from(Object3D.DEFAULT_UP);
    this.updateMatrix();

    this.target = new Object3D();
    this.shadow = new DirectionalLightShadow();
  }

  dispose() {
    this.shadow.dispose();
  }

  copy(source: this): this {
    super.copy(source);

    this.target = source.target.clone();
    this.shadow = source.shadow.clone();

    return this;
  }
}
DirectionalLight.prototype.isDirectionalLight = true;
DirectionalLight.prototype.type = 'DirectionalLight';
