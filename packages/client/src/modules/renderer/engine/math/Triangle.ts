import { Vec3 } from './Vector3.js';
import { Box3_ } from '@modules/renderer/engine/math/Box3.js';
import { Plane_ } from '@modules/renderer/engine/math/Plane.js';
import { BufferAttribute } from '@modules/renderer/engine/core/BufferAttribute.js';
import { Const } from '@modules/renderer/engine/math/types.js';

export interface Triangle {
  a: Vec3;
  b: Vec3;
  c: Vec3;
}

export namespace Triangle {
  export const create = (a: Vec3, b: Vec3, c: Vec3): Triangle => ({ a, b, c });
  export const empty = (): Triangle => ({ a: Vec3.empty(), b: Vec3.empty(), c: Vec3.empty() });

  export const set = (self: Triangle, a: Const<Vec3>, b: Const<Vec3>, c: Const<Vec3>): Triangle => {
    Vec3.fill_(self.a, a);
    Vec3.fill_(self.b, b);
    Vec3.fill_(self.c, c);
    return self;
  };
  export const fill_ = (self: Triangle, { a, b, c }: Const<Triangle>): Triangle => set(self, a, b, c);

  export const fromPointsAndIndices = (points: Const<Vec3>[], i0: number, i1: number, i2: number): Triangle =>
    fromPointsAndIndices_(points, i0, i1, i2, empty());
  export const fromPointsAndIndices_ = (
    points: Const<Vec3>[],
    i0: number,
    i1: number,
    i2: number,
    into: Triangle,
  ): Triangle => set(into, points[i0], points[i1], points[i2]);
  export const fillPointsAndIndices = (
    self: Triangle,
    points: Const<Vec3>[],
    i0: number,
    i1: number,
    i2: number,
  ): Triangle => fromPointsAndIndices_(points, i0, i1, i2, self);

  export const fromAttributeAndIndices = (
    attribute: Const<BufferAttribute>,
    i0: number,
    i1: number,
    i2: number,
  ): Triangle => fromAttributeAndIndices_(attribute, i0, i1, i2, empty());
  export const fromAttributeAndIndices_ = (
    attribute: Const<BufferAttribute>,
    i0: number,
    i1: number,
    i2: number,
    into: Triangle,
  ): Triangle => {
    Vec3.fromAttribute_(attribute, i0, into.a);
    Vec3.fromAttribute_(attribute, i1, into.b);
    Vec3.fromAttribute_(attribute, i2, into.c);
    return into;
  };
  export const fillAttributeAndIndices = (
    self: Triangle,
    attribute: Const<BufferAttribute>,
    i0: number,
    i1: number,
    i2: number,
  ) => fromAttributeAndIndices_(attribute, i0, i1, i2, self);

  export const clone = (from: Const<Triangle>): Triangle => clone_(from, empty());
  export const clone_ = (from: Const<Triangle>, into: Triangle): Triangle => fill_(into, from);

  export const copy = (from: Triangle): Triangle => copy_(from, empty());
  export const copy_ = (from: Triangle, into: Triangle): Triangle => {
    into.a = from.a;
    into.b = from.b;
    into.c = from.c;
    return into;
  };

  export const equals = (a: Const<Triangle>, b: Const<Triangle>): boolean =>
    Vec3.equals(a.a, b.a) && Vec3.equals(a.b, b.b) && Vec3.equals(a.c, b.c);

  const _vec = Vec3.empty();
  export const normal = (self: Const<Triangle>): Vec3 => normal_(self, Vec3.empty());
  export const normal_ = ({ a, b, c }: Const<Triangle>, into: Vec3): Vec3 => {
    Vec3.sub_(c, b, into);
    Vec3.sub_(a, b, _vec);
    Vec3.cross(into, _vec);

    const len = Vec3.lengthSq(into);
    return len > 0 ? Vec3.scale(into, 1 / Math.sqrt(len)) : Vec3.clear(into);
  };

  export const plane = (self: Const<Triangle>): Plane_ => plane_(self, Plane_.empty());
  export const plane_ = ({ a, b, c }: Const<Triangle>, into: Plane_): Plane_ => Plane_.fillCoplanar(into, a, b, c);

  const _v0 = Vec3.empty();
  const _v1 = Vec3.empty();
  const _v2 = Vec3.empty();
  export const barycoord = (from: Const<Triangle>, vec: Vec3): Vec3 | null => barycoord_(from, vec, Vec3.empty());
  export const barycoord_ = ({ a, b, c }: Const<Triangle>, vec: Const<Vec3>, into: Vec3): Vec3 | null => {
    Vec3.sub_(c, a, _v0);
    Vec3.sub_(b, a, _v1);
    Vec3.sub_(vec, a, _v2);

    const dot00 = Vec3.dot(_v0, _v0);
    const dot01 = Vec3.dot(_v0, _v1);
    const dot02 = Vec3.dot(_v0, _v2);
    const dot11 = Vec3.dot(_v1, _v1);
    const dot12 = Vec3.dot(_v1, _v2);

    const denom = dot00 * dot11 - dot01 * dot01;

    if (denom === 0) {
      Vec3.set(into, 0, 0, 0);
      return null;
    }

    const inverse = 1 / denom;
    const u = (dot11 * dot02 - dot01 * dot12) * inverse;
    const v = (dot00 * dot12 - dot01 * dot02) * inverse;

    return Vec3.set(into, 1 - u - v, v, u);
  };

  export const containsVec = (self: Const<Triangle>, vec: Const<Vec3>): boolean => {
    if (barycoord_(self, vec, _v0) === null) return false;
    return _v0.x >= 0 && _v0.y >= 0 && _v0.x + _v0.y <= 1;
  };

  export const isFrontFacing = ({ a, b, c }: Const<Triangle>, direction: Const<Vec3>): boolean => {
    Vec3.sub_(c, b, _v0);
    Vec3.sub_(a, b, _v1);
    Vec3.cross(_v0, _v1);

    return Vec3.dot(_v0, direction) < 0;
  };
  export const intersectsBox = (self: Const<Triangle>, box: Const<Box3_>): boolean =>
    Box3_.intersectsTriangle(box, self);

  export const area = ({ a, b, c }: Const<Triangle>): number => {
    Vec3.sub_(c, b, _v0);
    Vec3.sub_(a, b, _v1);
    Vec3.cross(_v0, _v1);

    return Vec3.length(_v0) * 0.5;
  };

  export const midpoint = (self: Const<Triangle>): Vec3 => midpoint_(self, Vec3.empty());
  export const midpoint_ = ({ a, b, c }: Const<Triangle>, into: Vec3): Vec3 => {
    Vec3.add_(a, b, into);
    Vec3.add(into, c);
    return Vec3.scale(into, 1 / 3);
  };

  export const interpolate = (a: Const<Triangle>, b: Const<Triangle>, point: Const<Vec3>): Vec3 | null =>
    interpolate_(a, b, point, Vec3.empty());

  export const interpolate_ = (a: Const<Triangle>, b: Const<Triangle>, point: Const<Vec3>, into: Vec3): Vec3 | null => {
    Vec3.clear(into);
    if (barycoord_(a, point, _v0) === null) return null;

    Vec3.scale_(b.a, _v0.x, _v1);
    Vec3.add_(into, _v1, into);

    Vec3.scale_(b.b, _v0.y, _v1);
    Vec3.add_(into, _v1, into);

    Vec3.scale_(b.c, _v0.z, _v1);
    Vec3.add_(into, _v1, into);

    return into;
  };

  export const closestTo = (self: Const<Triangle>, point: Const<Vec3>): Vec3 => closestTo_(self, point, Vec3.empty());
  export const closestTo_ = ({ a, b, c }: Const<Triangle>, p: Const<Vec3>, into: Vec3): Vec3 => {
    Vec3.sub_(b, a, _v0);
    Vec3.sub_(c, a, _v1);

    Vec3.sub_(p, a, _v2);
    const d1 = Vec3.dot(_v0, _v2);
    const d2 = Vec3.dot(_v1, _v2);
    if (d1 <= 0 && d2 <= 0) return Vec3.fill_(into, a);

    Vec3.sub_(p, b, _v2);
    const d3 = Vec3.dot(_v0, _v2);
    const d4 = Vec3.dot(_v1, _v2);
    if (d3 >= 0 && d4 <= d3) return Vec3.fill_(into, b);

    const vc = d1 * d4 - d3 * d2;
    if (vc <= 0 && d1 >= 0 && d3 <= 0) {
      const v = d1 / (d1 - d3);
      Vec3.fill_(into, a);
      Vec3.scale(_v0, v);
      return Vec3.add(into, _v0);
    }

    Vec3.sub_(p, c, _v2);
    const d5 = Vec3.dot(_v0, _v2);
    const d6 = Vec3.dot(_v1, _v2);
    if (d6 >= 0 && d5 <= d6) return Vec3.fill_(into, c);

    const vb = d5 * d2 - d1 * d6;
    if (vb <= 0 && d2 >= 0 && d6 <= 0) {
      const w = d2 / (d2 - d6);
      Vec3.fill_(into, b);
      Vec3.scale(_v1, w);
      return Vec3.add(into, _v1);
    }

    const va = d3 * d6 - d5 * d4;
    if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) {
      const w = (d4 - d3) / (d4 - d3 + d5 - d6);
      Vec3.sub_(c, b, _v0);
      Vec3.fill_(into, b);
      Vec3.scale(_v0, w);
      return Vec3.add(into, _v0);
    }

    const denom = 1 / (va + vb + vc);
    const v = vb * denom;
    const w = vc * denom;

    Vec3.fill_(into, a);
    Vec3.scale(_v0, v);
    Vec3.add(into, _v0);
    Vec3.scale(_v1, w);
    Vec3.add(into, _v1);

    return into;
  };
}
