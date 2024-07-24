import { Mat4 } from '../math/Mat4.js';
import { Entity } from '../core/Entity.js';
import type { Vec3 } from '../math/Vec3.js';
import type { PerspectiveCamera } from '@modules/renderer/engine/cameras/PerspectiveCamera.js';
import type { OrthographicCamera } from '@modules/renderer/engine/cameras/OrthographicCamera.js';

export type ICamera = PerspectiveCamera | OrthographicCamera;

export class Camera extends Entity {
  declare isCamera: true;
  declare type: string | 'Camera';
  matrixWorldInverse: Mat4;
  projectionMatrix: Mat4;
  projectionMatrixInverse: Mat4;

  constructor() {
    super();

    this.matrixWorldInverse = new Mat4();

    this.projectionMatrix = new Mat4();
    this.projectionMatrixInverse = new Mat4();
  }

  copy(source: Camera, recursive?: boolean): this {
    super.copy(source as unknown as Entity, recursive);

    this.matrixWorldInverse.from(source.matrixWorldInverse);
    this.projectionMatrix.from(source.projectionMatrix);
    this.projectionMatrixInverse.from(source.projectionMatrixInverse);

    return this;
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

  clone(): this {
    return new this.constructor().copy(this);
  }
}

Camera.prototype.isCamera = true;
Camera.prototype.type = 'Camera';
