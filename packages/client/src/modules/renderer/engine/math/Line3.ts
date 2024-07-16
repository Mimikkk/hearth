import { IVec3 } from './Vector3.js';
import { Matrix4 } from './Matrix4.js';
import { clamp } from './MathUtils.js';
import { Const } from '@modules/renderer/engine/math/types.js';

export interface Line3 {
  start: IVec3;
  end: IVec3;
}

export namespace Line3 {
  export const create = (
    startX: number,
    startY: number,
    startZ: number,
    endX: number,
    endY: number,
    endZ: number,
  ): Line3 => ({
    start: IVec3.create(startX, startY, startZ),
    end: IVec3.create(endX, endY, endZ),
  });
  export const empty = (): Line3 => create(0, 0, 0, 0, 0, 0);

  export const set = (
    self: Line3,
    startX: number,
    startY: number,
    startZ: number,
    endX: number,
    endY: number,
    endZ: number,
  ): Line3 => {
    IVec3.set(self.start, startX, startY, startZ);
    IVec3.set(self.end, endX, endY, endZ);
    return self;
  };
  export const fill_ = (self: Line3, from: Const<Line3>): Line3 => {
    IVec3.fill(self.start, from.start);
    IVec3.fill(self.end, from.end);
    return self;
  };

  export const fromEnds = (start: Const<IVec3>, end: Const<IVec3>): Line3 => fromEnds_(start, end, empty());
  export const fromEnds_ = (start: Const<IVec3>, end: Const<IVec3>, into: Line3): Line3 => {
    IVec3.clone_(start, into.start);
    IVec3.clone_(end, into.end);
    return into;
  };
  export const fillEnds = (self: Line3, start: Const<IVec3>, end: Const<IVec3>): Line3 => fromEnds_(start, end, self);

  export const copy = (from: Const<Line3>): Line3 => copy_(from, empty());
  export const copy_ = ({ start, end }: Const<Line3>, into: Line3): Line3 => {
    into.start = start;
    into.end = end;
    return into;
  };

  export const clone = (from: Const<Line3>): Line3 => clone_(from, empty());
  export const clone_ = (from: Const<Line3>, into: Line3): Line3 => fill_(into, from);

  export const distanceSq = ({ end, start }: Const<Line3>): number => IVec3.distanceSqTo(start, end);
  export const distance = ({ end, start }: Const<Line3>): number => IVec3.distanceTo(start, end);

  export const at = (self: Line3, step: number): IVec3 => at_(self, step, IVec3.empty());
  export const at_ = (from: Const<Line3>, step: number, into: IVec3): IVec3 => {
    delta_(from, into);
    IVec3.scale(into, clamp(step, 0, 1));
    IVec3.add(into, from.start);

    return into;
  };

  export const center = (from: Const<Line3>): IVec3 => center_(from, IVec3.empty());
  export const center_ = ({ end, start }: Const<Line3>, into: IVec3): IVec3 => {
    IVec3.add_(start, end, into);
    IVec3.scale(into, 0.5);
    return into;
  };

  export const delta = (from: Const<Line3>): IVec3 => delta_(from, IVec3.empty());
  export const delta_ = ({ end, start }: Const<Line3>, into: IVec3): IVec3 => IVec3.sub_(end, start, into);

  export const applyMat4 = (self: Line3, matrix: Const<Matrix4>): Line3 => applyMat4_(self, matrix, self);
  export const applyMat4_ = (from: Const<Line3>, matrix: Const<Matrix4>, into: Line3): Line3 => {
    IVec3.applyMat4_(from.start, matrix, into.start);
    IVec3.applyMat4_(from.end, matrix, into.end);
    return into;
  };

  const _vec1 = IVec3.empty();
  const _vec2 = IVec3.empty();
  export const closestAt = (self: Const<Line3>, vec: Const<IVec3>): number => {
    IVec3.sub_(vec, self.start, _vec1);
    IVec3.sub_(self.end, self.start, _vec2);

    return clamp(IVec3.dot(_vec2, _vec1) / IVec3.dot(_vec2, _vec2), 0, 1);
  };

  export const closestTo = (self: Const<Line3>, vec: Const<IVec3>): IVec3 => closestTo_(self, vec, IVec3.empty());
  export const closestTo_ = (self: Const<Line3>, vec: Const<IVec3>, into: IVec3): IVec3 =>
    at_(self, closestAt(self, vec), into);

  export const equals = (a: Const<Line3>, b: Const<Line3>): boolean =>
    IVec3.equals(a.start, b.start) && IVec3.equals(a.end, b.end);
}
