import { Camera } from './Camera.js';
import * as MathUtils from '../math/MathUtils.js';
import { Vec2 } from '../math/Vec2.js';
import { Vec3 } from '../math/Vec3.js';

const _v3 = /*@__PURE__*/ new Vec3();
const _minTarget = /*@__PURE__*/ new Vec2();
const _maxTarget = /*@__PURE__*/ new Vec2();

export class PerspectiveCamera extends Camera {
  declare isPerspectiveCamera: true;
  declare type: string | 'PerspectiveCamera';

  zoom: number;
  focus: number;
  view: {
    enabled: boolean;
    fullWidth: number;
    fullHeight: number;
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
  } | null;
  filmGaugeMM: number;
  filmOffsetMM: number;

  constructor(
    public fov: number = 50,
    public aspect: number = 1,
    public near: number = 0.1,
    public far: number = 2000,
  ) {
    super();

    this.fov = fov;
    this.zoom = 1;

    this.near = near;
    this.far = far;
    this.focus = 10;

    this.aspect = aspect;
    this.view = null;

    this.filmGaugeMM = 35;
    this.filmOffsetMM = 0;

    this.updateProjectionMatrix();
  }

  static is(value: any): value is PerspectiveCamera {
    return value && value.isPerspectiveCamera;
  }

  copy(source: PerspectiveCamera, recursive?: boolean): this {
    super.copy(source, recursive);

    this.fov = source.fov;
    this.zoom = source.zoom;

    this.near = source.near;
    this.far = source.far;
    this.focus = source.focus;

    this.aspect = source.aspect;
    this.view = source.view === null ? null : Object.assign({}, source.view);

    this.filmGaugeMM = source.filmGaugeMM;
    this.filmOffsetMM = source.filmOffsetMM;

    return this;
  }

  /**
   * Sets the FOV by focal length in respect to the current .filmGauge.
   *
   * The default film gauge is 35, so that the focal length can be specified for
   * a 35mm (full frame) camera.
   *
   * Values for focal length and film gauge must have the same unit.
   */
  setFocalLength(focalLength: number): this {
    /** see {@link http://www.bobatkins.com/photography/technical/field_of_view.html} */
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
    // film not completely covered in portrait format (aspect < 1)
    return this.filmGaugeMM * Math.min(this.aspect, 1);
  }

  getFilmHeight(): number {
    // film not completely covered in landscape format (aspect > 1)
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

    if (this.view === null) {
      this.view = {
        enabled: true,
        fullWidth: 1,
        fullHeight: 1,
        offsetX: 0,
        offsetY: 0,
        width: 1,
        height: 1,
      };
    }

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

    if (this.view !== null && this.view.enabled) {
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

    this.projectionMatrix.asPerspective(left, left + width, top, top - height, near, this.far, this.coordinateSystem);

    this.projectionMatrixInverse.clone(this.projectionMatrix).invert();
    return this;
  }
}
PerspectiveCamera.prototype.isPerspectiveCamera = true;
PerspectiveCamera.prototype.type = 'PerspectiveCamera';
