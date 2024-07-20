import { Vec3, Vector3 } from './Vector3.js';
import { Box3, Box3_ } from '@modules/renderer/engine/math/Box3.js';

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
  export const fill_ = ({ start, end, radius }: Readonly<Capsule>, into: Capsule): Capsule =>
    fill(into, start.x, start.y, start.z, end.x, end.y, end.z, radius);

  export const translate = (capsule: Capsule, vec: Readonly<Vec3>): Capsule => translate_(capsule, vec, capsule);
  export const translate_ = (self: Readonly<Capsule>, vec: Readonly<Vec3>, into: Capsule): Capsule => {
    Vec3.add_(self.start, vec, into.start);
    Vec3.add_(self.end, vec, into.end);

    return into;
  };
  export const translated = (capsule: Readonly<Capsule>, vec: Readonly<Vec3>): Capsule =>
    translate(fill_(capsule, empty()), vec);

  export const clone = ({ start, end, radius }: Readonly<Capsule>): Capsule => ({ start, end, radius });
  export const copy = ({ start, end, radius }: Readonly<Capsule>): Capsule => ({
    start: Vec3.copy(start),
    end: Vec3.copy(end),
    radius,
  });

  export const center = (capsule: Readonly<Capsule>): Vec3 => center_(capsule, Vec3.empty());
  export const center_ = ({ start, end }: Readonly<Capsule>, into: Vec3): Vec3 =>
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

  export const intersectsBox = ({ start, end, radius }: Readonly<Capsule>, { min, max }: Readonly<Box3_>): boolean =>
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
