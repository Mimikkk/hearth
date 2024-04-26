import { Light } from './Light.js';
import { SpotLightShadow } from './SpotLightShadow.js';
import { Object3D } from '../core/Object3D.js';
import { ColorRepresentation } from '../math/Color.js';
import { Texture } from '../textures/Texture.js';

export class SpotLight extends Light<SpotLightShadow> {
  declare isSpotLight: true;
  declare type: string | 'SpotLight';
  target: Object3D;
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

    this.position.copy(Object3D.DEFAULT_UP);
    this.updateMatrix();

    this.target = new Object3D();
    this.distance = distance;
    this.angle = angle;
    this.penumbra = penumbra;
    this.decay = decay;
    this.map = null;

    this.shadow = new SpotLightShadow();
  }

  get power() {
    // compute the light's luminous power (in lumens) from its intensity (in candela)
    // by convention for a spotlight, luminous power (lm) = π * luminous intensity (cd)
    return this.intensity * Math.PI;
  }

  set power(power) {
    // set the light's intensity (in candela) from the desired luminous power (in lumens)
    this.intensity = power / Math.PI;
  }

  dispose() {
    this.shadow.dispose();
  }

  copy(source: this, recursive?: boolean): this {
    super.copy(source, recursive);

    this.distance = source.distance;
    this.angle = source.angle;
    this.penumbra = source.penumbra;
    this.decay = source.decay;

    this.target = source.target.clone();

    this.shadow = source.shadow.clone();

    return this;
  }
}

SpotLight.prototype.isSpotLight = true;
SpotLight.prototype.type = 'SpotLight';
