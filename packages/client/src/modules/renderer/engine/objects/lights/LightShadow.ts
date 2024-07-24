import { Mat4 } from '../../math/Mat4.js';
import { Vec2 } from '../../math/Vec2.js';
import { Vec3 } from '../../math/Vec3.js';
import { Vec4 } from '../../math/Vec4.js';
import { Frustum } from '../../math/Frustum.js';
import { Camera } from '../../cameras/Camera.js';
import { Light } from './Light.js';
import { RenderTarget } from '@modules/renderer/engine/renderers/RenderTarget.js';

const _projScreenMatrix = new Mat4();
const _lightPositionWorld = Vec3.new();
const _lookTarget = Vec3.new();

export class LightShadow<C extends Camera = Camera> {
  declare ['constructor']: typeof LightShadow;
  bias: number;
  normalBias: number;
  radius: number;
  blurSamples: number;
  mapSize: Vec2;
  map: RenderTarget | null;
  mapPass: RenderTarget | null;
  matrix: Mat4;
  autoUpdate: boolean;
  needsUpdate: boolean;
  _frustum: Frustum;
  _frameExtents: Vec2;
  _viewportCount: number;
  _viewports: Vec4[];

  constructor(public camera: C) {
    this.bias = 0;
    this.normalBias = 0;
    this.radius = 1;
    this.blurSamples = 8;

    this.mapSize = Vec2.new(512, 512);

    this.map = null;
    this.mapPass = null;
    this.matrix = new Mat4();

    this.autoUpdate = true;
    this.needsUpdate = false;

    this._frustum = new Frustum();
    this._frameExtents = Vec2.new(1, 1);

    this.viewportCount = 1;

    this.viewports = [Vec4.new(0, 0, 1, 1)];
  }

  getViewportCount(): number {
    return this.viewportCount;
  }

  getFrustum(): Frustum {
    return this._frustum;
  }

  updateMatrices(light: Light<LightShadow<C>>): this {
    const shadowCamera = this.camera;
    const shadowMatrix = this.matrix;

    _lightPositionWorld.fromMat4Position(light.matrixWorld);
    shadowCamera.position.from(_lightPositionWorld);

    _lookTarget.fromMat4Position(light.target.matrixWorld);
    shadowCamera.lookAt(_lookTarget);
    shadowCamera.updateMatrixWorld();

    _projScreenMatrix.asMul(shadowCamera.projectionMatrix, shadowCamera.matrixWorldInverse);
    this._frustum.fromProjection(_projScreenMatrix);

    shadowMatrix.set(0.5, 0.0, 0.0, 0.5, 0.0, 0.5, 0.0, 0.5, 0.0, 0.0, 0.5, 0.5, 0.0, 0.0, 0.0, 1.0);

    shadowMatrix.mul(_projScreenMatrix);
    return this;
  }

  getViewport(viewportIndex: number): Vec4 {
    return this.viewports[viewportIndex];
  }

  getFrameExtents() {
    return this._frameExtents;
  }

  copy(source: this, recursive?: boolean): this {
    this.camera = source.camera.clone();

    this.bias = source.bias;
    this.radius = source.radius;

    this.mapSize.from(source.mapSize);

    return this;
  }

  clone(): this {
    //@ts-expect-error
    return new this.constructor().copy(this);
  }
}
