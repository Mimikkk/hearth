import { Vec2 } from './Vec2.js';

export class Box2 {
  declare isBox2: true;
  declare ['constructor']: typeof Box2;

  constructor(
    public min: Vec2 = new Vec2(+Infinity, +Infinity),
    public max: Vec2 = new Vec2(-Infinity, -Infinity),
  ) {}

  set(min: Vec2, max: Vec2): Box2 {
    this.min.copy(min);
    this.max.copy(max);

    return this;
  }

  setFromPoints(points: Vec2[]): this {
    this.makeEmpty();

    for (let i = 0, il = points.length; i < il; ++i) {
      this.expandByPoint(points[i]);
    }

    return this;
  }

  setFromCenterAndSize(center: Vec2, size: Vec2): this {
    const halfSize = new Vec2().copy(size).multiplyScalar(0.5);
    this.min.copy(center).sub(halfSize);
    this.max.copy(center).add(halfSize);

    return this;
  }

  clone(): Box2 {
    return new this.constructor().copy(this);
  }

  copy(box: Box2): this {
    this.min.copy(box.min);
    this.max.copy(box.max);

    return this;
  }

  makeEmpty(): this {
    this.min.x = this.min.y = +Infinity;
    this.max.x = this.max.y = -Infinity;

    return this;
  }

  isEmpty(): boolean {
    // this is a more robust check for empty than ( volume <= 0 ) because volume can get positive with two negative axes

    return this.max.x < this.min.x || this.max.y < this.min.y;
  }

  getCenter(target: Vec2): Vec2 {
    return this.isEmpty() ? target.set(0, 0) : target.addVectors(this.min, this.max).multiplyScalar(0.5);
  }

  getSize(target: Vec2): Vec2 {
    return this.isEmpty() ? target.set(0, 0) : target.subVectors(this.max, this.min);
  }

  expandByPoint(point: Vec2): this {
    this.min.min(point);
    this.max.max(point);

    return this;
  }

  expandByVector(vector: Vec2): this {
    this.min.sub(vector);
    this.max.add(vector);

    return this;
  }

  expandByScalar(scalar: number): this {
    this.min.addScalar(-scalar);
    this.max.addScalar(scalar);

    return this;
  }

  containsPoint(point: Vec2): boolean {
    return !(point.x < this.min.x || point.x > this.max.x || point.y < this.min.y || point.y > this.max.y);
  }

  containsBox(box: Box2): boolean {
    return this.min.x <= box.min.x && box.max.x <= this.max.x && this.min.y <= box.min.y && box.max.y <= this.max.y;
  }

  getParameter(point: Vec2, target: Vec2): Vec2 {
    // This can potentially have a divide by zero if the box
    // has a size dimension of 0.

    return target.set(
      (point.x - this.min.x) / (this.max.x - this.min.x),
      (point.y - this.min.y) / (this.max.y - this.min.y),
    );
  }

  intersectsBox(box: Box2): boolean {
    // using 4 splitting planes to rule out intersections

    return !(box.max.x < this.min.x || box.min.x > this.max.x || box.max.y < this.min.y || box.min.y > this.max.y);
  }

  clampPoint(point: Vec2, target: Vec2): Vec2 {
    return target.copy(point).clamp(this.min, this.max);
  }

  distanceToPoint(point: Vec2): number {
    return this.clampPoint(point, new Vec2(0, 0)).distanceTo(point);
  }

  intersect(box: Box2): this {
    this.min.max(box.min);
    this.max.min(box.max);

    if (this.isEmpty()) this.makeEmpty();

    return this;
  }

  union(box: Box2): this {
    this.min.min(box.min);
    this.max.max(box.max);

    return this;
  }

  translate(offset: Vec2): this {
    this.min.add(offset);
    this.max.add(offset);

    return this;
  }

  equals(box: Box2): boolean {
    return box.min.equals(this.min) && box.max.equals(this.max);
  }
}
Box2.prototype.isBox2 = true;
