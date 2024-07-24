import { Curve } from '../core/Curve.js';
import { CubicBezier } from '../core/Interpolations.js';
import { Vec3 } from '../../math/Vec3.js';

export class CubicBezierCurve3 extends Curve<Vec3> {
  declare isCubicBezierCurve3: true;
  declare type: 'CubicBezierCurve3';

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

  copy(source: this): this {
    super.copy(source);

    this.v0.from(source.v0);
    this.v1.from(source.v1);
    this.v2.from(source.v2);
    this.v3.from(source.v3);

    return this;
  }
}

CubicBezierCurve3.prototype.isCubicBezierCurve3 = true;
CubicBezierCurve3.prototype.type = 'CubicBezierCurve3';
