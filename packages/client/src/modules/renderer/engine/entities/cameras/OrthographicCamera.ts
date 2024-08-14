import { Camera, CameraParameters, CameraView } from './Camera.js';

export class OrthographicCamera extends Camera {
  declare isOrthographicCamera: true;
  view: CameraView;
  zoom: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
  near: number;
  far: number;

  constructor(parameters?: OrthographicCameraParameters) {
    super(parameters);

    this.zoom = parameters?.zoom ?? 1;
    this.view = parameters?.view ?? CameraView.new();
    this.left = parameters?.left ?? -1;
    this.right = parameters?.right ?? 1;
    this.top = parameters?.top ?? 1;
    this.bottom = parameters?.bottom ?? -1;
    this.near = parameters?.near ?? 0.1;
    this.far = parameters?.far ?? 2000;

    this.updateProjectionMatrix();
  }

  static is(value: any): value is OrthographicCamera {
    return value?.isOrthographicCamera === true;
  }

  setViewOffset(fullWidth: number, fullHeight: number, x: number, y: number, width: number, height: number): this {
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
    this.view.enabled = false;

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

export interface OrthographicCameraParameters extends CameraParameters {
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
  near?: number;
  far?: number;
  zoom?: number;
  view?: CameraView;
}
