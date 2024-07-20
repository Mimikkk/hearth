import { Mat4 } from '../math/Mat4.js';
import { Object3D } from '../core/Object3D.js';
import { Vec3 } from '../math/Vec3.js';

export class Camera extends Object3D {
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
    super.copy(source, recursive);

    this.matrixWorldInverse.from(source.matrixWorldInverse);
    this.projectionMatrix.from(source.projectionMatrix);
    this.projectionMatrixInverse.from(source.projectionMatrixInverse);

    return this;
  }

  getWorldDirection(into: Vec3 = Vec3.new()): Vec3 {
    return super.getWorldDirection(into).negate();
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
Camera.prototype.type = 'Camera';
