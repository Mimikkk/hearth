import { Vec3 } from './Vector3.js';
import { Matrix4 } from './Matrix4.js';
import { clamp } from './MathUtils.js';
import { Const } from '@modules/renderer/engine/math/types.js';

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

  set(start: Vec3, end: Vec3): this {
    this.start.from(start);
    this.end.from(end);
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
    return this.at(this.closestAt(vec), into);
  }

  closestAt(vec: Const<Vec3>): number {
    const offset = _v1.from(vec).sub(this.start);
    const delta = this.delta(_v2);

    return clamp(delta.dot(offset) / delta.dot(delta), 0, 1);
  }

  applyMat4(matrix: Const<Matrix4>): this {
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

const _v1 = Vec3.new();
const _v2 = Vec3.new();
