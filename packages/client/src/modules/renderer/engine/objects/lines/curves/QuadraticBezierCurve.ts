import { Curve } from '../Curve.js';
import { QuadraticBezier } from '../Interpolations.js';
import { Vec2 } from '../../../math/Vec2.js';

export class QuadraticBezierCurve extends Curve<Vec2> {
  declare isQuadraticBezierCurve: true;
  declare type: 'QuadraticBezierCurve';

  constructor(
    public v0: Vec2 = Vec2.new(),
    public v1: Vec2 = Vec2.new(),
    public v2: Vec2 = Vec2.new(),
  ) {
    super();
  }

  getPoint(t: number, optionalTarget: Vec2 = Vec2.new()): Vec2 {
    const point = optionalTarget;

    const v0 = this.v0,
      v1 = this.v1,
      v2 = this.v2;

    point.set(QuadraticBezier(t, v0.x, v1.x, v2.x), QuadraticBezier(t, v0.y, v1.y, v2.y));

    return point;
  }

  copy(source: this): this {
    super.copy(source);

    this.v0.from(source.v0);
    this.v1.from(source.v1);
    this.v2.from(source.v2);

    return this;
  }
}

QuadraticBezierCurve.prototype.isQuadraticBezierCurve = true;
QuadraticBezierCurve.prototype.type = 'QuadraticBezierCurve';
