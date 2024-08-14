import { Light } from './Light.js';
import { SpotLightShadow } from './SpotLightShadow.js';
import { Entity } from '../../core/Entity.js';
import { ColorRepresentation } from '../../math/Color.js';
import { Texture } from '@modules/renderer/engine/entities/textures/Texture.js';

export class SpotLight extends Light<SpotLightShadow> {
  declare isSpotLight: true;
  target: Entity;
  map: null | Texture;
  shadow: SpotLightShadow;

  constructor(
    color: ColorRepresentation,
    intensity: number,
    public distance: number = 0,
    public angle: number = Math.PI / 3,
    public penumbra: number = 0,
    public decay: number = 2,
  ) {
    super(color, intensity);

    this.position.from(Entity.Up);
    this.updateMatrix();

    this.target = new Entity();
    this.distance = distance;
    this.angle = angle;
    this.penumbra = penumbra;
    this.decay = decay;
    this.map = null;

    this.shadow = new SpotLightShadow();
  }

  get power() {
    return this.intensity * Math.PI;
  }

  set power(power) {
    this.intensity = power / Math.PI;
  }
}

SpotLight.prototype.isSpotLight = true;
