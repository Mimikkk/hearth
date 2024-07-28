import { Curve } from '../Curve.js';
import { Vec2 } from '../../Vec2.js';

export class EllipseCurve extends Curve<Vec2> {
  declare isEllipseCurve: true;
  declare type: string | 'EllipseCurve';

  constructor(
    public aX: number = 0,
    public aY: number = 0,
    public xRadius: number = 1,
    public yRadius: number = 1,
    public aStartAngle: number = 0,
    public aEndAngle: number = Math.PI * 2,
    public aClockwise = false,
    public aRotation: number = 0,
  ) {
    super();
  }

  getPoint(t: number, optionalTarget: Vec2 = Vec2.new()): Vec2 {
    const point = optionalTarget;

    const twoPi = Math.PI * 2;
    let deltaAngle = this.aEndAngle - this.aStartAngle;
    const samePoints = Math.abs(deltaAngle) < Number.EPSILON;

    while (deltaAngle < 0) deltaAngle += twoPi;
    while (deltaAngle > twoPi) deltaAngle -= twoPi;

    if (deltaAngle < Number.EPSILON) {
      if (samePoints) {
        deltaAngle = 0;
      } else {
        deltaAngle = twoPi;
      }
    }

    if (this.aClockwise === true && !samePoints) {
      if (deltaAngle === twoPi) {
        deltaAngle = -twoPi;
      } else {
        deltaAngle = deltaAngle - twoPi;
      }
    }

    const angle = this.aStartAngle + t * deltaAngle;
    let x = this.aX + this.xRadius * Math.cos(angle);
    let y = this.aY + this.yRadius * Math.sin(angle);

    if (this.aRotation !== 0) {
      const cos = Math.cos(this.aRotation);
      const sin = Math.sin(this.aRotation);

      const tx = x - this.aX;
      const ty = y - this.aY;


      x = tx * cos - ty * sin + this.aX;
      y = tx * sin + ty * cos + this.aY;
    }

    return point.set(x, y);
  }

  copy(source: this): this {
    super.copy(source);

    this.aX = source.aX;
    this.aY = source.aY;

    this.xRadius = source.xRadius;
    this.yRadius = source.yRadius;

    this.aStartAngle = source.aStartAngle;
    this.aEndAngle = source.aEndAngle;

    this.aClockwise = source.aClockwise;

    this.aRotation = source.aRotation;

    return this;
  }
}

EllipseCurve.prototype.isEllipseCurve = true;
EllipseCurve.prototype.type = 'EllipseCurve';
