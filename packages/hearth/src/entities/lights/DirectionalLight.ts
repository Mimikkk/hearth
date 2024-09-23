import { Light } from './Light.js';
import { DirectionalLightShadow } from './DirectionalLightShadow.js';
import { Entity } from '../../core/Entity.js';
import { ColorRepresentation } from '../../math/Color.js';

export class DirectionalLight extends Light<DirectionalLightShadow> {
  declare isDirectionalLight: true;
  target: Entity;
  shadow: DirectionalLightShadow;

  constructor(color: ColorRepresentation, intensity: number) {
    super(color, intensity);

    this.position.from(Entity.Up);
    this.updateMatrix();

    this.target = new Entity();
    this.shadow = new DirectionalLightShadow();
  }
}

DirectionalLight.prototype.isDirectionalLight = true;
