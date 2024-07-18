import { Vec3 } from '../../math/Vec3.js';
import { Curve } from '../core/Curve.js';

export class LineCurve3 extends Curve<Vec3> {
  declare isLineCurve3: true;
  declare type: 'LineCurve3';

  constructor(
    public v1: Vec3 = new Vec3(),
    public v2: Vec3 = new Vec3(),
  ) {
    super();
  }

  getPoint(t: number, optionalTarget: Vec3 = new Vec3()): Vec3 {
    const point = optionalTarget;

    if (t === 1) {
      point.copy(this.v2);
    } else {
      point.copy(this.v2).sub(this.v1);
      point.multiplyScalar(t).add(this.v1);
    }

    return point;
  }

  // Line curve is linear, so we can overwrite default getPointAt
  getPointAt(u: number, optionalTarget: Vec3 = new Vec3()) {
    return this.getPoint(u, optionalTarget);
  }

  getTangent(t: number, optionalTarget: Vec3 = new Vec3()) {
    return optionalTarget.subVectors(this.v2, this.v1).normalize();
  }

  getTangentAt(u: number, optionalTarget: Vec3 = new Vec3()) {
    return this.getTangent(u, optionalTarget);
  }

  copy(source: this): this {
    super.copy(source);

    this.v1.copy(source.v1);
    this.v2.copy(source.v2);

    return this;
  }
}
LineCurve3.prototype.isLineCurve3 = true;
LineCurve3.prototype.type = 'LineCurve3';
