import { LightShadow } from './LightShadow.js';
import { PerspectiveCamera } from '../cameras/PerspectiveCamera.js';
import { Mat4 } from '../math/Mat4.js';
import { Vec2 } from '../math/Vec2.js';
import { Vec3 } from '../math/Vec3.js';
import { Vec4 } from '../math/Vec4.js';
import { PointLight } from './PointLight.js';

const _projScreenMatrix = /*@__PURE__*/ new Mat4();
const _lightPositionWorld = /*@__PURE__*/ new Vec3();
const _lookTarget = /*@__PURE__*/ new Vec3();

export class PointLightShadow extends LightShadow<PerspectiveCamera> {
  declare isPointLightShadow: true;
  _cubeDirections: Vec3[];
  _cubeUps: Vec3[];

  constructor() {
    super(new PerspectiveCamera(90, 1, 0.5, 500));
    this._frameExtents = new Vec2(4, 2);

    this._viewportCount = 6;

    this._viewports = [
      // These viewports map a cube-map onto a 2D texture with the
      // following orientation:
      //
      //  xzXZ
      //   y Y
      //
      // X - Positive x direction
      // x - Negative x direction
      // Y - Positive y direction
      // y - Negative y direction
      // Z - Positive z direction
      // z - Negative z direction

      // positive X
      new Vec4(2, 1, 1, 1),
      // negative X
      new Vec4(0, 1, 1, 1),
      // positive Z
      new Vec4(3, 1, 1, 1),
      // negative Z
      new Vec4(1, 1, 1, 1),
      // positive Y
      new Vec4(3, 0, 1, 1),
      // negative Y
      new Vec4(1, 0, 1, 1),
    ];

    this._cubeDirections = [
      new Vec3(1, 0, 0),
      new Vec3(-1, 0, 0),
      new Vec3(0, 0, 1),
      new Vec3(0, 0, -1),
      new Vec3(0, 1, 0),
      new Vec3(0, -1, 0),
    ];

    this._cubeUps = [
      new Vec3(0, 1, 0),
      new Vec3(0, 1, 0),
      new Vec3(0, 1, 0),
      new Vec3(0, 1, 0),
      new Vec3(0, 0, 1),
      new Vec3(0, 0, -1),
    ];
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
    _lookTarget.add(this._cubeDirections[viewportIndex]);
    camera.up.from(this._cubeUps[viewportIndex]);
    camera.lookAt(_lookTarget);
    camera.updateMatrixWorld();

    shadowMatrix.asTranslation(_update.set(-_lightPositionWorld.x, -_lightPositionWorld.y, -_lightPositionWorld.z));

    _projScreenMatrix.asMul(camera.projectionMatrix, camera.matrixWorldInverse);
    this._frustum.setFromProjectionMatrix(_projScreenMatrix);
    return this;
  }
}
PointLightShadow.prototype.isPointLightShadow = true;

const _update = Vec3.new();
