import { Mat4 } from '../math/Mat4.js';
import { Vec2 } from '../math/Vec2.js';
import { Vec3 } from '../math/Vec3.js';
import { Vec4 } from '../math/Vec4.js';
import { Frustum } from '../math/Frustum.js';
import { Camera } from '../cameras/Camera.js';
import { Light } from './Light.js';
import { RenderTarget } from '@modules/renderer/engine/core/RenderTarget.js';

export class LightShadow<C extends Camera = Camera> {
  declare ['constructor']: typeof LightShadow;
  bias: number;
  normalBias: number;
  radius: number;
  blurSamples: number;
  mapSize: Vec2;
  autoUpdate: boolean;
  needsUpdate: boolean;
  frustum: Frustum;
  frameExtents: Vec2;
  viewportCount: number;
  viewports: Vec4[];
  map: RenderTarget | null;
  mapPass: RenderTarget | null;
  matrix: Mat4;

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

    this.frustum = Frustum.empty();
    this.frameExtents = Vec2.new(1, 1);

    this.viewportCount = 1;
  }

  updateMatrices(light: Light<LightShadow<C>>): this {
    const shadowCamera = this.camera;
    const shadowMatrix = this.matrix;

    _positionWorld.fromMat4Position(light.matrixWorld);
    shadowCamera.position.from(_positionWorld);

    _look.fromMat4Position(light.target.matrixWorld);
    shadowCamera.lookAt(_look);
    shadowCamera.updateMatrixWorld();

    _projectionMat.multiplyMatrices(shadowCamera.projectionMatrix, shadowCamera.matrixWorldInverse);
    this.frustum.fromProjection(shadowCamera.projectionMatrix);

    shadowMatrix.set(0.5, 0.0, 0.0, 0.5, 0.0, 0.5, 0.0, 0.5, 0.0, 0.0, 0.5, 0.5, 0.0, 0.0, 0.0, 1.0);
    shadowMatrix.mul(_projectionMat);

    return this;
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

const _projectionMat = new Mat4();
const _positionWorld = new Vec3();
const _look = Vec3.new();
