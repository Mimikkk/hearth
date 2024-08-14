import { Vec2 } from '../Vec2.js';
import { CurvePath } from './CurvePath.js';
import { EllipseCurve } from '@modules/renderer/engine/math/curves/curves/EllipseCurve.js';
import { SplineCurve } from '@modules/renderer/engine/math/curves/curves/SplineCurve.js';
import { CubicBezierCurve } from '@modules/renderer/engine/math/curves/curves/CubicBezierCurve.js';
import { QuadraticBezierCurve } from '@modules/renderer/engine/math/curves/curves/QuadraticBezierCurve.js';
import { LineCurve } from '@modules/renderer/engine/math/curves/curves/LineCurve.js';

export class Path extends CurvePath<Vec2> {
  currentPoint: Vec2;

  constructor(points?: Vec2[]) {
    super();

    this.currentPoint = Vec2.new();
    if (points) this.setFromPoints(points);
  }

  setFromPoints(points: Vec2[]) {
    this.moveTo(points[0].x, points[0].y);

    for (let i = 1, l = points.length; i < l; i++) {
      this.lineTo(points[i].x, points[i].y);
    }

    return this;
  }

  moveTo(x: number, y: number): this {
    this.currentPoint.set(x, y);

    return this;
  }

  lineTo(x: number, y: number): this {
    const curve = new LineCurve(this.currentPoint.clone(), Vec2.new(x, y));
    this.curves.push(curve);

    this.currentPoint.set(x, y);

    return this;
  }

  quadraticCurveTo(aCPx: number, aCPy: number, aX: number, aY: number): this {
    const curve = new QuadraticBezierCurve(this.currentPoint.clone(), Vec2.new(aCPx, aCPy), Vec2.new(aX, aY));

    this.curves.push(curve);

    this.currentPoint.set(aX, aY);

    return this;
  }

  bezierCurveTo(aCP1x: number, aCP1y: number, aCP2x: number, aCP2y: number, aX: number, aY: number): this {
    const curve = new CubicBezierCurve(
      this.currentPoint.clone(),
      Vec2.new(aCP1x, aCP1y),
      Vec2.new(aCP2x, aCP2y),
      Vec2.new(aX, aY),
    );

    this.curves.push(curve);

    this.currentPoint.set(aX, aY);

    return this;
  }

  splineThru(pts: Vec2[]): this {
    const npts = [this.currentPoint.clone()].concat(pts);

    const curve = new SplineCurve(npts);
    this.curves.push(curve);

    this.currentPoint.from(pts[pts.length - 1]);

    return this;
  }

  arc(aX: number, aY: number, aRadius: number, aStartAngle: number, aEndAngle: number, aClockwise: boolean): this {
    return this.absarc(aX + this.currentPoint.x, aY + this.currentPoint.y, aRadius, aStartAngle, aEndAngle, aClockwise);
  }

  absarc(aX: number, aY: number, aRadius: number, aStartAngle: number, aEndAngle: number, aClockwise: boolean): this {
    return this.absellipse(aX, aY, aRadius, aRadius, aStartAngle, aEndAngle, aClockwise, 0);
  }

  ellipse(
    aX: number,
    aY: number,
    xRadius: number,
    yRadius: number,
    aStartAngle: number,
    aEndAngle: number,
    aClockwise: boolean,
    aRotation: number,
  ): this {
    return this.absellipse(
      aX + this.currentPoint.x,
      aY + this.currentPoint.y,
      xRadius,
      yRadius,
      aStartAngle,
      aEndAngle,
      aClockwise,
      aRotation,
    );
  }

  absellipse(
    aX: number,
    aY: number,
    xRadius: number,
    yRadius: number,
    aStartAngle: number,
    aEndAngle: number,
    aClockwise: boolean,
    aRotation: number,
  ): this {
    const curve = new EllipseCurve(aX, aY, xRadius, yRadius, aStartAngle, aEndAngle, aClockwise, aRotation);

    if (this.curves.length > 0) {
      const firstPoint = curve.getPoint(0, Vec2.new());

      if (!firstPoint.equals(this.currentPoint)) {
        this.lineTo(firstPoint.x, firstPoint.y);
      }
    }

    this.curves.push(curve);

    const lastPoint = curve.getPoint(1, Vec2.new());
    this.currentPoint.from(lastPoint);

    return this;
  }
}
