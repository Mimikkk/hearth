import { Curve } from '../core/Curve.js';
import { CubicBezier } from '../core/Interpolations.js';
import { Vec2 } from '../../math/Vector2.js';

class CubicBezierCurve extends Curve<Vec2> {
  declare isCubicBezierCurve: true;
  declare type: 'CubicBezierCurve';

  constructor(
    public v0: Vec2 = Vec2.new(),
    public v1: Vec2 = Vec2.new(),
    public v2: Vec2 = Vec2.new(),
    public v3: Vec2 = Vec2.new(),
  ) {
    super();
  }

  getPoint(t: number, optionalTarget: Vec2 = Vec2.new()): Vec2 {
    const point = optionalTarget;
    const { v0, v1, v2, v3 } = this;

    point.set(CubicBezier(t, v0.x, v1.x, v2.x, v3.x), CubicBezier(t, v0.y, v1.y, v2.y, v3.y));

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

export { CubicBezierCurve };
CubicBezierCurve.prototype.isCubicBezierCurve = true;
CubicBezierCurve.prototype.type = 'CubicBezierCurve';
