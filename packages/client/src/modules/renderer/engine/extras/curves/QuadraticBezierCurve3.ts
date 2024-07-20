import { Curve } from '../core/Curve.js';
import { QuadraticBezier } from '../core/Interpolations.js';
import { Vector3 } from '../../math/Vector3.js';

export class QuadraticBezierCurve3 extends Curve<Vector3> {
  declare isQuadraticBezierCurve3: true;
  declare type: 'QuadraticBezierCurve3';

  constructor(
    public v0: Vector3 = new Vector3(),
    public v1: Vector3 = new Vector3(),
    public v2: Vector3 = new Vector3(),
  ) {
    super();

    this.isQuadraticBezierCurve3 = true;

    this.type = 'QuadraticBezierCurve3';
  }

  getPoint(t: number, optionalTarget: Vector3 = new Vector3()): Vector3 {
    const point = optionalTarget;
    const { v0, v1, v2 } = this;

    point.set(
      QuadraticBezier(t, v0.x, v1.x, v2.x),
      QuadraticBezier(t, v0.y, v1.y, v2.y),
      QuadraticBezier(t, v0.z, v1.z, v2.z),
    );

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
QuadraticBezierCurve3.prototype.isQuadraticBezierCurve3 = true;
QuadraticBezierCurve3.prototype.type = 'QuadraticBezierCurve3';
