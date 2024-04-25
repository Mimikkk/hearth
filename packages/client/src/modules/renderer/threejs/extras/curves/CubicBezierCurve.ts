import { Curve } from '../core/Curve.js';
import { CubicBezier } from '../core/Interpolations.js';
import { Vector2 } from '../../math/Vector2.js';

class CubicBezierCurve extends Curve<Vector2> {
  declare isCubicBezierCurve: true;
  declare type: 'CubicBezierCurve';

  constructor(
    public v0: Vector2,
    public v1: Vector2,
    public v2: Vector2,
    public v3: Vector2,
  ) {
    super();
  }

  getPoint(t: number, optionalTarget: Vector2): Vector2 {
    const point = optionalTarget;
    const { v0, v1, v2, v3 } = this;

    point.set(CubicBezier(t, v0.x, v1.x, v2.x, v3.x), CubicBezier(t, v0.y, v1.y, v2.y, v3.y));

    return point;
  }

  copy(source: CubicBezierCurve): this {
    super.copy(source);

    this.v0.copy(source.v0);
    this.v1.copy(source.v1);
    this.v2.copy(source.v2);
    this.v3.copy(source.v3);

    return this;
  }

  toJSON(): any {
    const data = super.toJSON() as any;

    data.v0 = this.v0.toArray();
    data.v1 = this.v1.toArray();
    data.v2 = this.v2.toArray();
    data.v3 = this.v3.toArray();

    return data;
  }

  fromJSON(json: any): any {
    super.fromJSON(json);

    this.v0.fromArray(json.v0);
    this.v1.fromArray(json.v1);
    this.v2.fromArray(json.v2);
    this.v3.fromArray(json.v3);

    return this;
  }
}

export { CubicBezierCurve };
CubicBezierCurve.prototype.isCubicBezierCurve = true;
CubicBezierCurve.prototype.type = 'CubicBezierCurve';
