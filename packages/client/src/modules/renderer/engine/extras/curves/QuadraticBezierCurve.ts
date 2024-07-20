import { Curve } from '../core/Curve.js';
import { QuadraticBezier } from '../core/Interpolations.js';
import { Vec2 } from '../../math/Vec2.js';

export class QuadraticBezierCurve extends Curve<Vec2> {
  declare isQuadraticBezierCurve: true;
  declare type: 'QuadraticBezierCurve';

  constructor(
    public v0: Vec2 = new Vec2(),
    public v1: Vec2 = new Vec2(),
    public v2: Vec2 = new Vec2(),
  ) {
    super();
  }

  getPoint(t: number, optionalTarget: Vec2 = new Vec2()): Vec2 {
    const point = optionalTarget;

    const v0 = this.v0,
      v1 = this.v1,
      v2 = this.v2;

    point.set(QuadraticBezier(t, v0.x, v1.x, v2.x), QuadraticBezier(t, v0.y, v1.y, v2.y));

    return point;
  }

  copy(source: this): this {
    super.copy(source);

    this.v0.copy(source.v0);
    this.v1.copy(source.v1);
    this.v2.copy(source.v2);

    return this;
  }
}
QuadraticBezierCurve.prototype.isQuadraticBezierCurve = true;
QuadraticBezierCurve.prototype.type = 'QuadraticBezierCurve';
