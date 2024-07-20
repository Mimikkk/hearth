import { LightShadow } from './LightShadow.js';
import { PerspectiveCamera } from '../cameras/PerspectiveCamera.js';
import { Mat4 } from '../math/Mat4.js';
import { Vec2 } from '../math/Vec2.js';
import { Vec3 } from '../math/Vec3.js';
import { PointLight } from './PointLight.js';

const _projScreenMatrix = new Mat4();
const _lightPositionWorld = new Vec3();
const _lookTarget = new Vec3();

export class PointLightShadow extends LightShadow<PerspectiveCamera> {
  declare isPointLightShadow: true;

  constructor() {
    super(new PerspectiveCamera(90, 1, 0.5, 500));
    this.frameExtents = Vec2.new(4, 2);

    this.viewportCount = 6;
  }

  updateMatrices(light: PointLight, viewportIndex: number = 0): this {
    const camera = this.camera;
    const shadowMatrix = this.matrix;

    const far = light.distance || camera.far;

    if (far !== camera.far) {
      camera.far = far;
      camera.updateProjectionMatrix();
    }

    _lightPositionWorld.fromMat4Position(light.matrixWorld);
    camera.position.from(_lightPositionWorld);

    _lookTarget.from(camera.position);
    _lookTarget.add(_directions[viewportIndex]);
    camera.up.from(_ups[viewportIndex]);
    camera.lookAt(_lookTarget);
    camera.updateMatrixWorld();

    shadowMatrix.asTranslation(-_lightPositionWorld.x, -_lightPositionWorld.y, -_lightPositionWorld.z);

    _projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    this.frustum.fromProjection(_projScreenMatrix);
    return this;
  }
}

PointLightShadow.prototype.isPointLightShadow = true;

const _ups = [
  Vec3.new(0, 1, 0),
  Vec3.new(0, 1, 0),
  Vec3.new(0, 1, 0),
  Vec3.new(0, 1, 0),
  Vec3.new(0, 0, 1),
  Vec3.new(0, 0, -1),
];
const _directions = [
  Vec3.new(1, 0, 0),
  Vec3.new(-1, 0, 0),
  Vec3.new(0, 0, 1),
  Vec3.new(0, 0, -1),
  Vec3.new(0, 1, 0),
  Vec3.new(0, -1, 0),
];
