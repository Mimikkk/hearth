import { Vector2 } from '../../math/Vector2.js';
import { Curve } from '../core/Curve.js';

export class LineCurve extends Curve<Vector2> {
  declare isLineCurve: true;
  declare type: 'LineCurve';

  constructor(
    public v1: Vector2,
    public v2: Vector2,
  ) {
    super();
  }

  getPoint(t: number, optionalTarget: Vector2): Vector2 {
    const point = optionalTarget;

    if (t === 1) {
      point.copy(this.v2);
    } else {
      point.copy(this.v2).sub(this.v1);
      point.multiplyScalar(t).add(this.v1);
    }

    return point;
  }

  getPointAt(u: number, optionalTarget: Vector2): Vector2 {
    return this.getPoint(u, optionalTarget);
  }

  getTangent(t: number, optionalTarget: Vector2): Vector2 {
    return optionalTarget.subVectors(this.v2, this.v1).normalize();
  }

  getTangentAt(u: number, optionalTarget: Vector2): Vector2 {
    return this.getTangent(u, optionalTarget);
  }

  copy(source: this): this {
    super.copy(source);

    this.v1.copy(source.v1);
    this.v2.copy(source.v2);

    return this;
  }
}
LineCurve.prototype.isLineCurve = true;
LineCurve.prototype.type = 'LineCurve';
