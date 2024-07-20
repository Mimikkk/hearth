import { Vector3, Vector4 } from '../engine.js';
import { calcSurfacePoint } from './NURBSUtils.js';

export class NURBSSurface {
  constructor(
    public degree1: number,
    public degree2: number,
    public knots1: number[],
    public knots2: number[],
    public controlPoints: Vector4[][],
  ) {}

  getPoint(t1: number, t2: number, target: Vector3): Vector3 {
    const { degree1, degree2, knots1, knots2, controlPoints } = this;
    const u = knots1[0] + t1 * (knots1[knots1.length - 1] - knots1[0]);
    const v = knots2[0] + t2 * (knots2[knots2.length - 1] - knots2[0]);

    return calcSurfacePoint(degree1, degree2, knots1, knots2, controlPoints, u, v, target);
  }
}
