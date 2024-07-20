import { Vec3 } from './Vec3.js';
import { Mat4 } from './Mat4.js';
import * as MathUtils from './MathUtils.js';

const _startP = /*@__PURE__*/ new Vec3();
const _startEnd = /*@__PURE__*/ new Vec3();

export class Line3 {
  declare isLine3: true;
  declare ['constructor']: typeof Line3;

  constructor(
    public start: Vec3 = new Vec3(),
    public end: Vec3 = new Vec3(),
  ) {}

  set(start: Vec3, end: Vec3): Line3 {
    this.start.from(start);
    this.end.from(end);

    return this;
  }

  copy(line: Line3): Line3 {
    this.start.from(line.start);
    this.end.from(line.end);

    return this;
  }

  getCenter(target: Vec3): Vec3 {
    return target.addVectors(this.start, this.end).scale(0.5);
  }

  delta(target: Vec3): Vec3 {
    return target.subVectors(this.end, this.start);
  }

  distanceSq(): number {
    return this.start.distanceSqTo(this.end);
  }

  distance(): number {
    return this.start.distanceTo(this.end);
  }

  at(t: number, target: Vec3): Vec3 {
    return this.delta(target).scale(t).add(this.start);
  }

  closestPointToPointParameter(point: Vec3, clampToLine: boolean): number {
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

  closestPointToPoint(point: Vec3, clampToLine: boolean, target: Vec3): Vec3 {
    const t = this.closestPointToPointParameter(point, clampToLine);

    return this.delta(target).scale(t).add(this.start);
  }

  applyMat4(matrix: Mat4): Line3 {
    this.start.applyMat4(matrix);
    this.end.applyMat4(matrix);

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
