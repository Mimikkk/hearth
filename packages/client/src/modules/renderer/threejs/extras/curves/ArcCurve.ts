import { EllipseCurve } from './EllipseCurve.js';

export class ArcCurve extends EllipseCurve {
  declare isArcCurve: true;
  declare type: 'ArcCurve';

  constructor(aX: number, aY: number, aRadius: number, aStartAngle: number, aEndAngle: number, aClockwise: boolean) {
    super(aX, aY, aRadius, aRadius, aStartAngle, aEndAngle, aClockwise);
  }
}
ArcCurve.prototype.isArcCurve = true;
ArcCurve.prototype.type = 'ArcCurve';
