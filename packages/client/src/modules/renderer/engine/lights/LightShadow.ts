import { Matrix4 } from '../math/Matrix4.js';
import { Vector2 } from '../math/Vector2.js';
import { Vector3 } from '../math/Vector3.js';
import { Vector4 } from '../math/Vector4.js';
import { Frustum } from '../math/Frustum.js';
import { Camera } from '../cameras/Camera.js';
import { Light } from './Light.js';
import { RenderTarget } from '@modules/renderer/engine/core/RenderTarget.js';

const _projScreenMatrix = new Matrix4();
const _lightPositionWorld = new Vector3();
const _lookTarget = new Vector3();

export class LightShadow<C extends Camera = Camera> {
  declare ['constructor']: typeof LightShadow;
  bias: number;
  normalBias: number;
  radius: number;
  blurSamples: number;
  mapSize: Vector2;
  map: RenderTarget | null;
  mapPass: RenderTarget | null;
  matrix: Matrix4;
  autoUpdate: boolean;
  needsUpdate: boolean;
  _frustum: Frustum;
  _frameExtents: Vector2;
  _viewportCount: number;
  _viewports: Vector4[];

  constructor(public camera: C) {
    this.bias = 0;
    this.normalBias = 0;
    this.radius = 1;
    this.blurSamples = 8;

    this.mapSize = new Vector2(512, 512);

    this.map = null;
    this.mapPass = null;
    this.matrix = new Matrix4();

    this.autoUpdate = true;
    this.needsUpdate = false;

    this._frustum = Frustum.empty();
    this._frameExtents = new Vector2(1, 1);

    this._viewportCount = 1;

    this._viewports = [new Vector4(0, 0, 1, 1)];
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
    Frustum.fromProjection_(shadowCamera.projectionMatrix, this._frustum);

    shadowMatrix.set(0.5, 0.0, 0.0, 0.5, 0.0, 0.5, 0.0, 0.5, 0.0, 0.0, 0.5, 0.5, 0.0, 0.0, 0.0, 1.0);

    shadowMatrix.multiply(_projScreenMatrix);
    return this;
  }

  getViewport(viewportIndex: number): Vector4 {
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

    this.mapSize.copy(source.mapSize);

    return this;
  }

  clone(): this {
    //@ts-expect-error
    return new this.constructor().copy(this);
  }
}
