import { Mat4 } from '../math/Mat4.js';
import { Vec2 } from '../math/Vec2.js';
import { Vec3 } from '../math/Vec3.js';
import { Vec4 } from '../math/Vec4.js';
import { Frustum } from '../math/Frustum.js';
import { Camera } from '../cameras/Camera.js';
import { Light } from './Light.js';
import { RenderTarget } from '@modules/renderer/engine/core/RenderTarget.js';

const _projScreenMatrix = /*@__PURE__*/ new Mat4();
const _lightPositionWorld = /*@__PURE__*/ new Vec3();
const _lookTarget = /*@__PURE__*/ new Vec3();

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

    this.mapSize = new Vec2(512, 512);

    this.map = null;
    this.mapPass = null;
    this.matrix = new Mat4();

    this.autoUpdate = true;
    this.needsUpdate = false;

    this._frustum = new Frustum();
    this._frameExtents = new Vec2(1, 1);

    this._viewportCount = 1;

    this._viewports = [new Vec4(0, 0, 1, 1)];
  }

  getViewportCount(): number {
    return this._viewportCount;
  }

  getFrustum(): Frustum {
    return this._frustum;
  }

  updateMatrices(light: Light<LightShadow<C>>): this {
    const shadowCamera = this.camera;
    const shadowMatrix = this.matrix;

    _lightPositionWorld.setFromMatrixPosition(light.matrixWorld);
    shadowCamera.position.copy(_lightPositionWorld);

    _lookTarget.setFromMatrixPosition(light.target.matrixWorld);
    shadowCamera.lookAt(_lookTarget);
    shadowCamera.updateMatrixWorld();

    _projScreenMatrix.multiplyMatrices(shadowCamera.projectionMatrix, shadowCamera.matrixWorldInverse);
    this._frustum.setFromProjectionMatrix(_projScreenMatrix);

    shadowMatrix.set(0.5, 0.0, 0.0, 0.5, 0.0, 0.5, 0.0, 0.5, 0.0, 0.0, 0.5, 0.5, 0.0, 0.0, 0.0, 1.0);

    shadowMatrix.multiply(_projScreenMatrix);
    return this;
  }

  getViewport(viewportIndex: number): Vec4 {
    return this._viewports[viewportIndex];
  }

  getFrameExtents() {
    return this._frameExtents;
  }

  dispose() {
    if (this.map) {
      this.map.dispose();
    }

    if (this.mapPass) {
      this.mapPass.dispose();
    }
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
