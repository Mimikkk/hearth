import { Mat4 } from '../../math/Mat4.js';
import { Entity, EntityParameters } from '../../core/Entity.js';
import type { Vec3 } from '../../math/Vec3.js';
import type { PerspectiveCamera } from '@modules/renderer/engine/entities/cameras/PerspectiveCamera.js';
import type { OrthographicCamera } from '@modules/renderer/engine/entities/cameras/OrthographicCamera.js';

export type ICamera = PerspectiveCamera | OrthographicCamera;

export class Camera extends Entity {
  declare isCamera: true;
  matrixWorldInverse: Mat4;
  projectionMatrix: Mat4;
  projectionMatrixInverse: Mat4;

  constructor(parameters?: CameraParameters) {
    super(parameters);

    this.matrixWorldInverse = parameters?.matrixWorldInverse ?? Mat4.new();
    this.projectionMatrix = parameters?.projectionMatrix ?? Mat4.new();
    this.projectionMatrixInverse = parameters?.projectionMatrixInverse ?? Mat4.new();
  }

  getWorldDirection(target: Vec3): Vec3 {
    return super.getWorldDirection(target).negate();
  }

  updateMatrixWorld(force?: boolean): this {
    super.updateMatrixWorld(force);

    this.matrixWorldInverse.from(this.matrixWorld).invert();

    return this;
  }

  updateWorldMatrix(updateParents: boolean, updateChildren: boolean): this {
    super.updateWorldMatrix(updateParents, updateChildren);

    this.matrixWorldInverse.from(this.matrixWorld).invert();

    return this;
  }
}

Camera.prototype.isCamera = true;

export interface CameraParameters extends EntityParameters {
  matrixWorldInverse?: Mat4;
  projectionMatrix?: Mat4;
  projectionMatrixInverse?: Mat4;
}

export class CameraView {
  constructor(
    public enabled: boolean,
    public fullWidth: number,
    public fullHeight: number,
    public offsetX: number,
    public offsetY: number,
    public width: number,
    public height: number,
  ) {}

  static new(): CameraView {
    return new CameraView(true, 1, 1, 0, 0, 1, 1);
  }
}
