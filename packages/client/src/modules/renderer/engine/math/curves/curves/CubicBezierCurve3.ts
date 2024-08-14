import { Curve } from '../Curve.js';
import { CubicBezier } from '../Interpolations.js';
import { Vec3 } from '../../Vec3.js';

export class CubicBezierCurve3 extends Curve<Vec3> {
  declare isCubicBezierCurve3: true;

  constructor(
    public v0: Vec3 = Vec3.new(),
    public v1: Vec3 = Vec3.new(),
    public v2: Vec3 = Vec3.new(),
    public v3: Vec3 = Vec3.new(),
  ) {
    super();
  }

  getPoint(t: number, optionalTarget: Vec3 = Vec3.new()): Vec3 {
    const point = optionalTarget;

    const { v0, v1, v2, v3 } = this;

    point.set(
      CubicBezier(t, v0.x, v1.x, v2.x, v3.x),
      CubicBezier(t, v0.y, v1.y, v2.y, v3.y),
      CubicBezier(t, v0.z, v1.z, v2.z, v3.z),
    );

    return point;
  }
}

CubicBezierCurve3.prototype.isCubicBezierCurve3 = true;
