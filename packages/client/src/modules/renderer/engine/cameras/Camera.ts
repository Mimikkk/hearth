import { CoordinateSystem } from '../constants.js';
import { Mat4 } from '../math/Mat4.js';
import { Object3D } from '../core/Object3D.js';
import { Vec3 } from '../math/Vec3.js';

export class Camera extends Object3D {
  //@ts-expect-error
  declare ['constructor']: typeof Camera;
  declare isCamera: true;
  declare type: string | 'Camera';
  matrixWorldInverse: Mat4;
  projectionMatrix: Mat4;
  projectionMatrixInverse: Mat4;
  coordinateSystem: CoordinateSystem;

  constructor() {
    super();

    this.matrixWorldInverse = new Mat4();

    this.projectionMatrix = new Mat4();
    this.projectionMatrixInverse = new Mat4();

    this.coordinateSystem = CoordinateSystem.WebGL;
  }

  //@ts-expect-error
  copy(source: Camera, recursive?: boolean): this {
    super.copy(source as unknown as Object3D, recursive);

    this.matrixWorldInverse.clone(source.matrixWorldInverse);
    this.projectionMatrix.clone(source.projectionMatrix);
    this.projectionMatrixInverse.clone(source.projectionMatrixInverse);
    this.coordinateSystem = source.coordinateSystem;

    return this;
  }

  getWorldDirection(target: Vec3): Vec3 {
    return super.getWorldDirection(target).negate();
  }

  updateMatrixWorld(force?: boolean): this {
    super.updateMatrixWorld(force);

    this.matrixWorldInverse.clone(this.matrixWorld).invert();

    return this;
  }

  updateWorldMatrix(updateParents: boolean, updateChildren: boolean): this {
    super.updateWorldMatrix(updateParents, updateChildren);

    this.matrixWorldInverse.clone(this.matrixWorld).invert();

    return this;
  }

  //@ts-expect-error
  clone(): this {
    //@ts-expect-error
    return new this.constructor().copy(this);
  }
}
Camera.prototype.isCamera = true;
Camera.prototype.type = 'Camera';
