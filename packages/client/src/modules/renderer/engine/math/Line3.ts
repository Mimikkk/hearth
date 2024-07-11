import { Vec3, Vector3 } from './Vector3.js';
import { Matrix4 } from './Matrix4.js';
import * as MathUtils from './MathUtils.js';
import { clamp } from './MathUtils.js';
import { Const } from '@modules/renderer/engine/math/types.js';

export interface Line3_ {
  start: Vec3;
  end: Vec3;
}

export namespace Line3_ {
  export const create = (
    startX: number,
    startY: number,
    startZ: number,
    endX: number,
    endY: number,
    endZ: number,
  ): Line3_ => ({
    start: Vec3.create(startX, startY, startZ),
    end: Vec3.create(endX, endY, endZ),
  });
  export const empty = (): Line3_ => create(0, 0, 0, 0, 0, 0);

  export const set = (
    self: Line3_,
    startX: number,
    startY: number,
    startZ: number,
    endX: number,
    endY: number,
    endZ: number,
  ): Line3_ => {
    Vec3.set(self.start, startX, startY, startZ);
    Vec3.set(self.end, endX, endY, endZ);
    return self;
  };
  export const fill_ = (self: Line3_, from: Const<Line3_>): Line3_ => {
    Vec3.fill_(self.start, from.start);
    Vec3.fill_(self.end, from.end);
    return self;
  };

  export const copy = (from: Const<Line3_>): Line3_ => copy_(from, empty());
  export const copy_ = ({ start, end }: Const<Line3_>, into: Line3_): Line3_ => {
    into.start = start;
    into.end = end;
    return into;
  };

  export const clone = (from: Const<Line3_>): Line3_ => clone_(from, empty());
  export const clone_ = (from: Const<Line3_>, into: Line3_): Line3_ => fill_(into, from);

  export const distanceSq = ({ end, start }: Const<Line3_>): number => Vec3.distanceSqTo(start, end);
  export const distance = ({ end, start }: Const<Line3_>): number => Vec3.distanceTo(start, end);

  export const at = (self: Line3_, step: number): Vec3 => at_(self, step, Vec3.empty());
  export const at_ = (from: Const<Line3_>, step: number, into: Vec3): Vec3 => {
    delta_(from, into);
    Vec3.mulScalar(into, clamp(step, 0, 1));
    Vec3.add(into, from.start);

    return into;
  };

  export const center = (from: Const<Line3_>): Vec3 => center_(from, Vec3.empty());
  export const center_ = ({ end, start }: Const<Line3_>, into: Vec3): Vec3 => {
    Vec3.add_(start, end, into);
    Vec3.mulScalar(into, 0.5);
    return into;
  };

  export const delta = (from: Const<Line3_>): Vec3 => delta_(from, Vec3.empty());
  export const delta_ = ({ end, start }: Const<Line3_>, into: Vec3): Vec3 => Vec3.sub_(end, start, into);

  export const fromEnds = (start: Const<Vec3>, end: Const<Vec3>): Line3_ => fromEnds_(start, end, empty());
  export const fromEnds_ = (start: Const<Vec3>, end: Const<Vec3>, into: Line3_): Line3_ =>
    set(into, start.x, start.y, start.z, end.x, end.y, end.z);
  export const fillEnds = (self: Line3_, start: Const<Vec3>, end: Const<Vec3>): Line3_ => fromEnds_(start, end, self);

  export const applyMat4 = (self: Line3_, matrix: Const<Matrix4>): Line3_ => applyMat4_(self, matrix, self);
  export const applyMat4_ = (from: Const<Line3_>, matrix: Const<Matrix4>, into: Line3_): Line3_ => {
    Vec3.applyMat4_(from.start, matrix, into.start);
    Vec3.applyMat4_(from.end, matrix, into.end);
    return into;
  };

  const _vec1 = Vec3.empty();
  const _vec2 = Vec3.empty();
  export const closestAt = (self: Const<Line3_>, vec: Const<Vec3>): number => {
    Vec3.sub_(vec, self.start, _vec1);
    Vec3.sub_(self.end, self.start, _vec2);

    return clamp(Vec3.dot(_vec2, _vec1) / Vec3.dot(_vec2, _vec2), 0, 1);
  };

  export const closestTo = (self: Const<Line3_>, vec: Const<Vec3>): Vec3 => closestTo_(self, vec, Vec3.empty());
  export const closestTo_ = (self: Const<Line3_>, vec: Const<Vec3>, into: Vec3): Vec3 =>
    at_(self, closestAt(self, vec), into);

  export const equals = (a: Const<Line3_>, b: Const<Line3_>): boolean =>
    Vec3.equals(a.start, b.start) && Vec3.equals(a.end, b.end);
}
