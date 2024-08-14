import { Camera } from './Camera.js';

export class OrthographicCamera extends Camera {
  declare isOrthographicCamera: true;
  zoom: number;
  view: {
    enabled: boolean;
    fullWidth: number;
    fullHeight: number;
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
  } | null;

  constructor(
    public left: number = -1,
    public right: number = 1,
    public top: number = 1,
    public bottom: number = -1,
    public near: number = 0.1,
    public far: number = 2000,
  ) {
    super();

    this.zoom = 1;
    this.view = null;

    this.left = left;
    this.right = right;
    this.top = top;
    this.bottom = bottom;

    this.near = near;
    this.far = far;

    this.updateProjectionMatrix();
  }

  static is(value: any): value is OrthographicCamera {
    return value?.isOrthographicCamera === true;
  }

  setViewOffset(fullWidth: number, fullHeight: number, x: number, y: number, width: number, height: number): this {
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
    const dx = (this.right - this.left) / (2 * this.zoom);
    const dy = (this.top - this.bottom) / (2 * this.zoom);
    const cx = (this.right + this.left) / 2;
    const cy = (this.top + this.bottom) / 2;

    let left = cx - dx;
    let right = cx + dx;
    let top = cy + dy;
    let bottom = cy - dy;

    if (this.view !== null && this.view.enabled) {
      const scaleW = (this.right - this.left) / this.view.fullWidth / this.zoom;
      const scaleH = (this.top - this.bottom) / this.view.fullHeight / this.zoom;

      left += scaleW * this.view.offsetX;
      right = left + scaleW * this.view.width;
      top -= scaleH * this.view.offsetY;
      bottom = top - scaleH * this.view.height;
    }

    this.projectionMatrix.asOrthographic(left, right, top, bottom, this.near, this.far);

    this.projectionMatrixInverse.from(this.projectionMatrix).invert();
    return this;
  }
}

OrthographicCamera.prototype.isOrthographicCamera = true;
