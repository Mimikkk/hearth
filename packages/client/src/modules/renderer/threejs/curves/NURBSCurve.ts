import { Curve, Vector3, Vector4 } from '../Three.js';
import * as NURBSUtils from './NURBSUtils.js';

export class NURBSCurve extends Curve {
  constructor(
    public degree: number,
    public knots: number[],
    public controlPoints: Vector4[],
    public startKnot: number = 0,
    public endKnot: number = knots.length - 1,
  ) {
    super();
  }

  override getPoint(t: number, optionalTarget: Vector3 = new Vector3()): Vector3 {
    const { degree, knots, controlPoints, startKnot, endKnot } = this;
    const point = optionalTarget;

    const u = knots[startKnot] + t * (knots[endKnot] - knots[startKnot]);

    const hpoint = NURBSUtils.calcBSplinePoint(degree, knots, controlPoints, u);

    if (hpoint.w !== 1.0) hpoint.divideScalar(hpoint.w);

    return point.set(hpoint.x, hpoint.y, hpoint.z);
  }

  override getTangent(t: number, target: Vector3 = new Vector3()): Vector3 {
    const { degree, knots, controlPoints } = this;

    const u = knots[0] + t * (knots[knots.length - 1] - knots[0]);
    const ders = NURBSUtils.calcNURBSDerivatives(degree, knots, controlPoints, u, 1);
    return target.copy(ders[1]).normalize();
  }
}
