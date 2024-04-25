import { CoordinateSystem } from '../constants.js';
import { Matrix4 } from '../math/Matrix4.js';
import { Object3D } from '../core/Object3D.js';
import { Vector3 } from '../math/Vector3.js';

export class Camera extends Object3D {
  //@ts-expect-error
  declare ['constructor']: typeof Camera;
  declare isCamera: true;
  declare type: string | 'Camera';
  matrixWorldInverse: Matrix4;
  projectionMatrix: Matrix4;
  projectionMatrixInverse: Matrix4;
  coordinateSystem: CoordinateSystem;

  constructor() {
    super();

    this.matrixWorldInverse = new Matrix4();

    this.projectionMatrix = new Matrix4();
    this.projectionMatrixInverse = new Matrix4();

    this.coordinateSystem = CoordinateSystem.WebGL;
  }

  //@ts-expect-error
  copy(source: Camera, recursive?: boolean): this {
    super.copy(source as unknown as Object3D, recursive);

    this.matrixWorldInverse.copy(source.matrixWorldInverse);
    this.projectionMatrix.copy(source.projectionMatrix);
    this.projectionMatrixInverse.copy(source.projectionMatrixInverse);
    this.coordinateSystem = source.coordinateSystem;

    return this;
  }

  getWorldDirection(target: Vector3): Vector3 {
    return super.getWorldDirection(target).negate();
  }

  updateMatrixWorld(force?: boolean): this {
    super.updateMatrixWorld(force);

    this.matrixWorldInverse.copy(this.matrixWorld).invert();

    return this;
  }

  updateWorldMatrix(updateParents: boolean, updateChildren: boolean): this {
    super.updateWorldMatrix(updateParents, updateChildren);

    this.matrixWorldInverse.copy(this.matrixWorld).invert();

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
