import { Vec3, Vector3 } from './Vector3.js';
import { Matrix4 } from './Matrix4.js';
import * as MathUtils from './MathUtils.js';

const _startP = /*@__PURE__*/ new Vector3();
const _startEnd = /*@__PURE__*/ new Vector3();

export class Line3 {
  declare isLine3: true;
  declare ['constructor']: typeof Line3;

  constructor(
    public start: Vector3 = new Vector3(),
    public end: Vector3 = new Vector3(),
  ) {}

  set(start: Vec3, end: Vec3): Line3 {
    Vec3.clone_(start, this.start);
    Vec3.clone_(end, this.end);

    return this;
  }

  copy(line: Line3): Line3 {
    this.start.copy(line.start);
    this.end.copy(line.end);

    return this;
  }

  getCenter(target: Vector3): Vector3 {
    return target.addVectors(this.start, this.end).multiplyScalar(0.5);
  }

  delta(target: Vector3): Vector3 {
    return target.subVectors(this.end, this.start);
  }

  distanceSq(): number {
    return this.start.distanceToSquared(this.end);
  }

  distance(): number {
    return this.start.distanceTo(this.end);
  }

  at(t: number, target: Vector3): Vector3 {
    return this.delta(target).multiplyScalar(t).add(this.start);
  }

  closestPointToPointParameter(point: Vector3, clampToLine: boolean): number {
    _startP.subVectors(point, this.start);
    _startEnd.subVectors(this.end, this.start);

    const startEnd2 = _startEnd.dot(_startEnd);
    const startEnd_startP = _startEnd.dot(_startP);

    let t = startEnd_startP / startEnd2;

    if (clampToLine) {
      t = MathUtils.clamp(t, 0, 1);
    }

    return t;
  }

  closestPointToPoint(point: Vector3, clampToLine: boolean, target: Vector3): Vector3 {
    const t = this.closestPointToPointParameter(point, clampToLine);

    return this.delta(target).multiplyScalar(t).add(this.start);
  }

  applyMatrix4(matrix: Matrix4): Line3 {
    this.start.applyMatrix4(matrix);
    this.end.applyMatrix4(matrix);

    return this;
  }

  equals(line: Line3): boolean {
    return line.start.equals(this.start) && line.end.equals(this.end);
  }

  clone(): Line3 {
    return new this.constructor().copy(this);
  }
}
Line3.prototype.isLine3 = true;
