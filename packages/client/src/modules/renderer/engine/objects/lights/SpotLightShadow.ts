import { LightShadow } from './LightShadow.js';
import * as MathUtils from '../../math/MathUtils.js';
import { PerspectiveCamera } from '@modules/renderer/engine/objects/cameras/PerspectiveCamera.js';
import { SpotLight } from '@modules/renderer/engine/objects/lights/SpotLight.js';

export class SpotLightShadow extends LightShadow<PerspectiveCamera> {
  declare isSpotLightShadow: true;
  focus: number;

  constructor() {
    super(new PerspectiveCamera(50, 1, 0.5, 500));
    this.focus = 1;
  }

  updateMatrices(light: SpotLight): this {
    const camera = this.camera;

    const fov = MathUtils.RadianToDegree * 2 * light.angle * this.focus;
    const aspect = this.mapSize.width / this.mapSize.height;
    const far = light.distance || camera.far;

    if (fov !== camera.fov || aspect !== camera.aspect || far !== camera.far) {
      camera.fov = fov;
      camera.aspect = aspect;
      camera.far = far;
      camera.updateProjectionMatrix();
    }

    super.updateMatrices(light);
    return this;
  }

  copy(source: this): this {
    super.copy(source);

    this.focus = source.focus;

    return this;
  }
}

SpotLightShadow.prototype.isSpotLightShadow = true;
