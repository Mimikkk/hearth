import { calcVolumePoint } from './NURBSUtils.js';
import type { Vector3 } from '../math/Vector3.js';
import { Vector4 } from '../math/Vector4.js';

export class NURBSVolume {
  constructor(
    public degree1: number,
    public degree2: number,
    public degree3: number,
    public knots1: number[],
    public knots2: number[],
    public knots3: number[],
    public controlPoints: Vector4[][][],
  ) {}

  getPoint(t1: number, t2: number, t3: number, target: Vector3): Vector3 {
    const { degree1, degree2, degree3, knots1, knots2, knots3, controlPoints } = this;
    const u = knots1[0] + t1 * (knots1[knots1.length - 1] - knots1[0]);
    const v = knots2[0] + t2 * (knots2[knots2.length - 1] - knots2[0]);
    const w = knots3[0] + t3 * (knots3[knots3.length - 1] - knots3[0]);

    return calcVolumePoint(degree1, degree2, degree3, knots1, knots2, knots3, controlPoints, u, v, w, target);
  }
}
