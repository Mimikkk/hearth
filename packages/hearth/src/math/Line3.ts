import { Vec3 } from './Vec3.js';
import { Mat4 } from './Mat4.js';
import { Const } from './types.js';
import { clamp } from './MathUtils.js';
import { Attribute } from '../core/Attribute.js';

export class Line3 {
  declare isLine3: true;

  constructor(
    public start: Vec3 = Vec3.new(),
    public end: Vec3 = Vec3.new(),
  ) {}

  static new(start: Vec3 = Vec3.new(), end: Vec3 = Vec3.new()): Line3 {
    return new Line3(start, end);
  }

  static empty(): Line3 {
    return Line3.new();
  }

  static clone({ start, end }: Const<Line3>, into: Line3 = Line3.empty()): Line3 {
    return into.set(start, end);
  }

  static is(line: any): line is Line3 {
    return line?.isLine3 === true;
  }

  static into(into: Line3, { start, end }: Const<Line3>): Line3 {
    return into.set(start, end);
  }

  static from({ start, end }: Const<Line3>, into: Line3 = Line3.empty()): Line3 {
    return into.set(start, end);
  }

  static fromParams(
    x1: number,
    y1: number,
    z1: number,
    x2: number,
    y2: number,
    z2: number,
    into: Line3 = Line3.empty(),
  ): Line3 {
    return into.setParams(x1, y1, z1, x2, y2, z2);
  }

  static fromAttribute(
    attribute: Const<Attribute>,
    i0: number = 0,
    i1: number = 1,
    into: Line3 = Line3.empty(),
  ): Line3 {
    return into.fromAttribute(attribute, i0, i1);
  }

  clone(into: Line3 = Line3.new()): Line3 {
    return into.from(this);
  }

  set(start: Const<Vec3>, end: Const<Vec3>): this {
    this.start.from(start);
    this.end.from(end);
    return this;
  }

  setStart(vec: Const<Vec3>): this {
    this.start.from(vec);
    return this;
  }

  setEnd(vec: Const<Vec3>): this {
    this.end.from(vec);
    return this;
  }

  setParams(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): this {
    this.start.set(x1, y1, z1);
    this.end.set(x2, y2, z2);
    return this;
  }

  fromAttribute(attribute: Const<Attribute>, i0: number = 0, i1: number = 1): this {
    this.start.fromAttribute(attribute, i0);
    this.end.fromAttribute(attribute, i1);
    return this;
  }

  fill(into: Line3): this {
    into.from(this);
    return this;
  }

  from(line: Const<Line3>): this {
    return this.set(line.start, line.end);
  }

  distanceSq(): number {
    return this.start.distanceSqTo(this.end);
  }

  distance(): number {
    return this.start.distanceTo(this.end);
  }

  euclideanSq(): number {
    return this.distanceSq();
  }

  euclidean(): number {
    return this.distance();
  }

  at(step: number, into: Vec3 = Vec3.new()): Vec3 {
    return this.delta(into).scale(step).add(this.start);
  }

  closestTo(vec: Const<Vec3>, into: Vec3 = Vec3.new()): Vec3 {
    return this.at(clamp(this.closestAt(vec), 0, 1), into);
  }

  closestAt(vec: Const<Vec3>): number {
    const offset = _vec1.from(vec).sub(this.start);
    const delta = this.delta();

    return clamp(delta.dot(offset) / delta.dot(delta), 0, 1);
  }

  applyMat4(matrix: Const<Mat4>): this {
    this.start.applyMat4(matrix);
    this.end.applyMat4(matrix);
    return this;
  }

  equals({ end, start }: Const<Line3>): boolean {
    return this.start.equals(start) && this.end.equals(end);
  }

  delta(into: Vec3 = Vec3.new()): Vec3 {
    return into.from(this.end).sub(this.start);
  }

  center(into: Vec3 = Vec3.new()): Vec3 {
    return into.from(this.start).add(this.end).scale(0.5);
  }
}

Line3.prototype.isLine3 = true;

const _vec1 = Vec3.new();
