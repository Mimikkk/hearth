import { Vec3 } from '../../Vec3.js';
import { Curve } from '../Curve.js';

export class LineCurve3 extends Curve<Vec3> {
  declare isLineCurve3: true;

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

  getPointAt(u: number, optionalTarget: Vec3 = Vec3.new()) {
    return this.getPoint(u, optionalTarget);
  }

  getTangent(t: number, optionalTarget: Vec3 = Vec3.new()) {
    return optionalTarget.asSub(this.v2, this.v1).normalize();
  }

  getTangentAt(u: number, optionalTarget: Vec3 = Vec3.new()) {
    return this.getTangent(u, optionalTarget);
  }
}

LineCurve3.prototype.isLineCurve3 = true;
