import { Curve } from './Curve.js';
import * as Curves from '@modules/renderer/engine/math/curves/curves/Curves.js';
import type { Vec2 } from '../Vec2.js';
import type { Vec3 } from '../Vec3.js';

export class CurvePath<T extends Vec2 | Vec3> extends Curve<T> {
  declare type: string | 'CurvePath';
  autoClose: boolean = false;
  curves: Curve<T>[] = [];

  add(curve: Curve<T>): this {
    this.curves.push(curve);

    return this;
  }

  closePath(): this {
    // Add a line curve if start and end of lines are not connected
    const startPoint = this.curves[0].getPoint(0);
    const endPoint = this.curves[this.curves.length - 1].getPoint(1);

    if (!startPoint.equals(endPoint as Vec2 & Vec3)) {
      //@ts-expect-error
      const lineType = startPoint.isVec2 === true ? 'LineCurve' : 'LineCurve3';
      //@ts-expect-error
      this.curves.push(new Curves[lineType](endPoint, startPoint));
    }

    return this;
  }

  getPoint(t: number, optionalTarget?: T): T | null {
    const d = t * this.getLength();
    const curveLengths = this.getCurveLengths();
    let i = 0;

    // To think about boundaries points.

    while (i < curveLengths.length) {
      if (curveLengths[i] >= d) {
        const diff = curveLengths[i] - d;
        const curve = this.curves[i];

        const segmentLength = curve.getLength();
        const u = segmentLength === 0 ? 0 : 1 - diff / segmentLength;

        return curve.getPointAt(u, optionalTarget);
      }

      i++;
    }

    return null;
  }

  getLength(): number {
    const lens = this.getCurveLengths();
    return lens[lens.length - 1];
  }

  // cacheLengths must be recalculated.
  updateArcLengths(): number[] {
    return this.getCurveLengths();
  }

  getCurveLengths(): number[] {
    if (this.lengths && this.lengths.length === this.curves.length) {
      return this.lengths;
    }

    const lengths: number[] = [];
    let sums = 0;

    for (let i = 0, l = this.curves.length; i < l; i++) {
      sums += this.curves[i].getLength();
      lengths.push(sums);
    }

    this.lengths = lengths;

    return lengths;
  }

  getSpacedPoints(divisions: number): T[] {
    const points: T[] = [];

    for (let i = 0; i <= divisions; i++) {
      points.push(this.getPoint(i / divisions) as T);
    }

    if (this.autoClose) {
      points.push(points[0]);
    }

    return points;
  }

  getPoints(divisions: number): T[] {
    const points: T[] = [];
    let last;

    for (let i = 0, curves = this.curves; i < curves.length; i++) {
      const curve = curves[i];
      //@ts-expect-error
      const resolution = curve.isEllipseCurve
        ? divisions * 2
        : //@ts-expect-error
          curve.isLineCurve || curve.isLineCurve3
          ? 1
          : //@ts-expect-error
            curve.isSplineCurve
            ? //@ts-expect-error
              divisions * curve.points.length
            : divisions;

      const pts = curve.getPoints(resolution);

      for (let j = 0; j < pts.length; j++) {
        const point = pts[j];

        //@ts-expect-error
        if (last && last.equals(point)) continue;

        points.push(point);
        last = point;
      }
    }

    //@ts-expect-error
    if (this.autoClose && points.length > 1 && !points[points.length - 1].equals(points[0])) {
      points.push(points[0]);
    }

    return points;
  }

  copy(source: this): this {
    super.copy(source);

    this.curves = [];

    for (let i = 0, l = source.curves.length; i < l; i++) {
      const curve = source.curves[i];

      this.curves.push(curve.clone());
    }

    this.autoClose = source.autoClose;

    return this;
  }
}

CurvePath.prototype.type = 'CurvePath';
