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
    into: Capsule,
    startX: number,
    startY: number,
    startZ: number,
    endX: number,
    endY: number,
    endZ: number,
    radius: number,
  ): Capsule => {
    into.start.x = startX;
    into.start.y = startY;
    into.start.z = startZ;
    into.end.x = endX;
    into.end.y = endY;
    into.end.z = endZ;
    into.radius = radius;

    return into;
  };
  export const fill_ = (into: Capsule, { start, end, radius }: Const<Capsule>): Capsule =>
    fill(into, start.x, start.y, start.z, end.x, end.y, end.z, radius);

  export const copy = (self: Const<Capsule>): Capsule => copy_(self, empty());
  export const copy_ = ({ start, end, radius }: Const<Capsule>, into: Capsule): Capsule => {
    into.start = start;
    into.end = end;
    into.radius = radius;

    return into;
  };

  export const clone = (self: Const<Capsule>): Capsule => fill_(self, empty());
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
}
