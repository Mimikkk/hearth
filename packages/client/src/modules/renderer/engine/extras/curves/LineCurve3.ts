import { Vec3 } from '../../math/Vec3.js';
import { Curve } from '../core/Curve.js';

export class LineCurve3 extends Curve<Vec3> {
  declare isLineCurve3: true;
  declare type: 'LineCurve3';

  constructor(
    public v1: Vec3 = Vec3.new(),
    public v2: Vec3 = Vec3.new(),
  ) {
    super();
  }

  getPoint(t: number, optionalTarget: Vec3 = Vec3.new()): Vec3 {
    const point = optionalTarget;

    if (t === 1) {
      point.from(this.v2);
    } else {
      point.from(this.v2).sub(this.v1);
      point.scale(t).add(this.v1);
    }

    return point;
  }

  // Line curve is linear, so we can overwrite default getPointAt
  getPointAt(u: number, optionalTarget: Vec3 = Vec3.new()) {
    return this.getPoint(u, optionalTarget);
  }

  getTangent(t: number, optionalTarget: Vec3 = Vec3.new()) {
    return optionalTarget.asSub(this.v2, this.v1).normalize();
  }

  getTangentAt(u: number, optionalTarget: Vec3 = Vec3.new()) {
    return this.getTangent(u, optionalTarget);
  }

  copy(source: this): this {
    super.copy(source);

    this.v1.from(source.v1);
    this.v2.from(source.v2);

    return this;
  }
}

LineCurve3.prototype.isLineCurve3 = true;
LineCurve3.prototype.type = 'LineCurve3';
