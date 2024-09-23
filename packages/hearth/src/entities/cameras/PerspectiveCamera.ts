import { Camera, CameraParameters, CameraView } from './Camera.js';
import * as MathUtils from '../../math/MathUtils.js';
import { Vec2 } from '../../math/Vec2.js';
import { Vec3 } from '../../math/Vec3.js';

const _v3 = Vec3.new();
const _minTarget = Vec2.new();
const _maxTarget = Vec2.new();

export class PerspectiveCamera extends Camera {
  declare isPerspectiveCamera: true;

  view: CameraView;
  zoom: number;
  focus: number;
  filmGaugeMM: number;
  filmOffsetMM: number;
  fov: number;
  aspect: number;
  near: number;
  far: number;

  constructor(parameters?: PerspectiveCameraParameters) {
    super(parameters);

    this.fov = parameters?.fov ?? 50;
    this.zoom = parameters?.zoom ?? 1;
    this.near = parameters?.near ?? 0.1;
    this.far = parameters?.far ?? 2000;
    this.focus = parameters?.focus ?? 10;
    this.aspect = parameters?.aspect ?? window.innerWidth / window.innerHeight;
    this.view = parameters?.view ?? CameraView.new();
    this.filmGaugeMM = parameters?.filmGaugeMM ?? 35;
    this.filmOffsetMM = parameters?.filmOffsetMM ?? 0;

    this.updateProjectionMatrix();
  }

  static is(value: any): value is PerspectiveCamera {
    return value && value.isPerspectiveCamera;
  }

  setFocalLength(focalLength: number): this {
    const vExtentSlope = (0.5 * this.getFilmHeight()) / focalLength;

    this.fov = MathUtils.RadianToDegree * 2 * Math.atan(vExtentSlope);
    this.updateProjectionMatrix();
    return this;
  }

  getFocalLength(): number {
    const vExtentSlope = Math.tan(MathUtils.DegreeToRadian * 0.5 * this.fov);

    return (0.5 * this.getFilmHeight()) / vExtentSlope;
  }

  getEffectiveFOV(): number {
    return MathUtils.RadianToDegree * 2 * Math.atan(Math.tan(MathUtils.DegreeToRadian * 0.5 * this.fov) / this.zoom);
  }

  getFilmWidth(): number {
    return this.filmGaugeMM * Math.min(this.aspect, 1);
  }

  getFilmHeight(): number {
    return this.filmGaugeMM / Math.max(this.aspect, 1);
  }

  getViewBounds(distance: number, minTarget: Vec2, maxTarget: Vec2): void {
    _v3.set(-1, -1, 0.5).applyMat4(this.projectionMatrixInverse);

    minTarget.set(_v3.x, _v3.y).scale(-distance / _v3.z);

    _v3.set(1, 1, 0.5).applyMat4(this.projectionMatrixInverse);

    maxTarget.set(_v3.x, _v3.y).scale(-distance / _v3.z);
  }

  getViewSize(distance: number, target: Vec2): Vec2 {
    this.getViewBounds(distance, _minTarget, _maxTarget);

    return target.asSub(_maxTarget, _minTarget);
  }

  setViewOffset(fullWidth: number, fullHeight: number, x: number, y: number, width: number, height: number): this {
    this.aspect = fullWidth / fullHeight;

    this.view.enabled = true;
    this.view.fullWidth = fullWidth;
    this.view.fullHeight = fullHeight;
    this.view.offsetX = x;
    this.view.offsetY = y;
    this.view.width = width;
    this.view.height = height;

    this.updateProjectionMatrix();
    return this;
  }

  clearViewOffset(): this {
    if (this.view !== null) {
      this.view.enabled = false;
    }

    this.updateProjectionMatrix();
    return this;
  }

  updateProjectionMatrix(): this {
    const near = this.near;
    let top = (near * Math.tan(MathUtils.DegreeToRadian * 0.5 * this.fov)) / this.zoom;
    let height = 2 * top;
    let width = this.aspect * height;
    let left = -0.5 * width;

    if (this.view.enabled) {
      const view = this.view;
      const fullWidth = view.fullWidth,
        fullHeight = view.fullHeight;

      left += (view.offsetX * width) / fullWidth;
      top -= (view.offsetY * height) / fullHeight;
      width *= view.width / fullWidth;
      height *= view.height / fullHeight;
    }

    const skew = this.filmOffsetMM;
    if (skew !== 0) left += (near * skew) / this.getFilmWidth();

    this.projectionMatrix.asPerspective(left, left + width, top, top - height, near, this.far);

    this.projectionMatrixInverse.from(this.projectionMatrix).invert();
    return this;
  }
}

PerspectiveCamera.prototype.isPerspectiveCamera = true;

export interface PerspectiveCameraParameters extends CameraParameters {
  fov?: number;
  aspect?: number;
  near?: number;
  far?: number;
  zoom?: number;
  focus?: number;
  view?: CameraView;
  filmGaugeMM?: number;
  filmOffsetMM?: number;
}
