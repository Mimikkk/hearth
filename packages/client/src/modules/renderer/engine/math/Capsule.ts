import { Vec3 } from './Vector3.js';
import { Box3_ } from '@modules/renderer/engine/math/Box3.js';
import { Const } from '@modules/renderer/engine/math/types.js';

export interface Capsule {
  start: Vec3;
  end: Vec3;
  radius: number;
}

export namespace Capsule {
  export const create = (
    startX: number,
    startY: number,
    startZ: number,
    endX: number,
    endY: number,
    endZ: number,
    radius: number,
  ): Capsule => ({
    start: Vec3.create(startX, startY, startZ),
    end: Vec3.create(endX, endY, endZ),
    radius,
  });
  export const empty = (): Capsule => create(0, 0, 0, 0, 0, 0, 0);

  export const fill = (
    self: Capsule,
    startX: number,
    startY: number,
    startZ: number,
    endX: number,
    endY: number,
    endZ: number,
    radius: number,
  ): Capsule => {
    self.start.x = startX;
    self.start.y = startY;
    self.start.z = startZ;
    self.end.x = endX;
    self.end.y = endY;
    self.end.z = endZ;
    self.radius = radius;

    return self;
  };
  export const fill_ = (self: Capsule, from: Const<Capsule>): Capsule => clone_(from, self);

  export const copy = (from: Const<Capsule>): Capsule => copy_(from, empty());
  export const copy_ = ({ start, end, radius }: Const<Capsule>, into: Capsule): Capsule => {
    into.start = start;
    into.end = end;
    into.radius = radius;

    return into;
  };

  export const clone = (from: Const<Capsule>): Capsule => fill_(from, empty());
  export const clone_ = (from: Const<Capsule>, into: Capsule): Capsule => fill_(into, from);

  export const translate = (capsule: Capsule, vec: Const<Vec3>): Capsule => translate_(capsule, vec, capsule);
  export const translate_ = (self: Const<Capsule>, vec: Const<Vec3>, into: Capsule): Capsule => {
    Vec3.add_(self.start, vec, into.start);
    Vec3.add_(self.end, vec, into.end);

    return into;
  };
  export const translated = (capsule: Const<Capsule>, vec: Const<Vec3>): Capsule =>
    translate(clone_(capsule, empty()), vec);

  export const center = (capsule: Const<Capsule>): Vec3 => center_(capsule, Vec3.empty());
  export const center_ = ({ start, end }: Const<Capsule>, into: Vec3): Vec3 =>
    Vec3.mulScalar(Vec3.add_(start, end, into), 0.5);

  const isAABBAxis = (
    p1x: number,
    p1y: number,
    p2x: number,
    p2y: number,
    minx: number,
    maxx: number,
    miny: number,
    maxy: number,
    radius: number,
  ): boolean =>
    (minx - p1x < radius || minx - p2x < radius) &&
    (p1x - maxx < radius || p2x - maxx < radius) &&
    (miny - p1y < radius || miny - p2y < radius) &&
    (p1y - maxy < radius || p2y - maxy < radius);

  export const intersectsBox = ({ start, end, radius }: Const<Capsule>, { min, max }: Const<Box3_>): boolean =>
    isAABBAxis(start.x, start.y, end.x, end.y, min.x, max.x, min.y, max.y, radius) &&
    isAABBAxis(start.x, start.z, end.x, end.z, min.x, max.x, min.z, max.z, radius) &&
    isAABBAxis(start.y, start.z, end.y, end.z, min.y, max.y, min.z, max.z, radius);

  export const temp0 = empty();
  export const temp1 = empty();
  export const temp2 = empty();
  export const temp3 = empty();
  export const temp4 = empty();
  export const temp5 = empty();
  export const temp6 = empty();
  export const temp7 = empty();
  export const temp8 = empty();
  export const temp9 = empty();
}
