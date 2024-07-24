import { LightShadow } from './LightShadow.js';
import { PerspectiveCamera } from '../../cameras/PerspectiveCamera.js';
import { Mat4 } from '../../math/Mat4.js';
import { Vec2 } from '../../math/Vec2.js';
import { Vec3 } from '../../math/Vec3.js';
import { Vec4 } from '../../math/Vec4.js';
import { PointLight } from './PointLight.js';

const _projScreenMatrix = new Mat4();
const _lightPositionWorld = Vec3.new();
const _lookTarget = Vec3.new();

export class PointLightShadow extends LightShadow<PerspectiveCamera> {
  declare isPointLightShadow: true;
  _cubeDirections: Vec3[];
  _cubeUps: Vec3[];

  constructor() {
    super(new PerspectiveCamera(90, 1, 0.5, 500));
    this._frameExtents = Vec2.new(4, 2);

    this.viewportCount = 6;

    this.viewports = [
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
      Vec4.new(2, 1, 1, 1),
      // negative X
      Vec4.new(0, 1, 1, 1),
      // positive Z
      Vec4.new(3, 1, 1, 1),
      // negative Z
      Vec4.new(1, 1, 1, 1),
      // positive Y
      Vec4.new(3, 0, 1, 1),
      // negative Y
      Vec4.new(1, 0, 1, 1),
    ];

    this._cubeDirections = [
      Vec3.new(1, 0, 0),
      Vec3.new(-1, 0, 0),
      Vec3.new(0, 0, 1),
      Vec3.new(0, 0, -1),
      Vec3.new(0, 1, 0),
      Vec3.new(0, -1, 0),
    ];

    this._cubeUps = [
      Vec3.new(0, 1, 0),
      Vec3.new(0, 1, 0),
      Vec3.new(0, 1, 0),
      Vec3.new(0, 1, 0),
      Vec3.new(0, 0, 1),
      Vec3.new(0, 0, -1),
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
    this._frustum.fromProjection(_projScreenMatrix);
    return this;
  }
}

PointLightShadow.prototype.isPointLightShadow = true;

const _update = Vec3.new();
