import { IVec2 } from '@modules/renderer/engine/math/Vector2.js';
import { clamp } from '@modules/renderer/engine/math/MathUtils.js';
import { Const } from './types.ts';

const { vec2 } = IVec2;

export interface Box2 {
  min: IVec2;
  max: IVec2;
}

export namespace Box2 {
  export const create = (minX: number, minY: number, maxX: number, maxY: number): Box2 => ({
    min: { x: minX, y: minY },
    max: { x: maxX, y: maxY },
  });
  export const box2 = create;

  export const empty = (): Box2 => create(+Infinity, +Infinity, -Infinity, -Infinity);
  export const clear = (self: Box2): Box2 => set(self, +Infinity, +Infinity, -Infinity, -Infinity);

  export const isEmpty = (self: Const<Box2>): boolean => self.max.x < self.min.x || self.max.y < self.min.y;

  export const set = (into: Box2, minX: number, minY: number, maxX: number, maxY: number): Box2 => {
    into.min.x = minX;
    into.min.y = minY;
    into.max.x = maxX;
    into.max.y = maxY;

    return into;
  };
  export const fill_ = (into: Box2, { min, max }: Const<Box2>): Box2 => set(into, min.x, min.y, max.x, max.y);

  export const copy = (from: Const<Box2>): Box2 => copy_(from, empty());
  export const copy_ = ({ min, max }: Const<Box2>, into: Box2): Box2 => {
    into.min = min;
    into.max = max;

    return into;
  };

  export const clone = (from: Const<Box2>): Box2 => clone_(from, empty());
  export const clone_ = (from: Const<Box2>, into: Box2): Box2 => fill_(into, from);

  export const size = (self: Const<Box2>): IVec2 => vec2(self.max.x - self.min.x, self.max.y - self.min.y);
  export const size_ = (self: Const<Box2>, into: IVec2): IVec2 => {
    into.x = self.max.x - self.min.x;
    into.y = self.max.y - self.min.y;

    return into;
  };

  export const center = (self: Const<Box2>): IVec2 =>
    vec2((self.min.x + self.max.x) / 2, (self.min.y + self.max.y) / 2);
  export const center_ = (self: Const<Box2>, into: IVec2): IVec2 => {
    into.x = (self.min.x + self.max.x) / 2;
    into.y = (self.min.y + self.max.y) / 2;

    return into;
  };

  export const expandByVec = (self: Box2, { x, y }: Const<IVec2>): Box2 => {
    if (x < self.min.x) self.min.x = x;
    if (y < self.min.y) self.min.y = y;
    if (x > self.max.x) self.max.x = x;
    if (y > self.max.y) self.max.y = y;

    return self;
  };
  export const expandedByVec = (self: Const<Box2>, vec: Const<IVec2>): Box2 => expandByVec(clone(self), vec);
  export const expandByVecs = (self: Box2, vecs: Const<IVec2>[]): Box2 => {
    for (let i = 0, it = vecs.length; i < it; ++i) expandByVec(self, vecs[i]);
    return self;
  };
  export const expandedByVecs = (self: Const<Box2>, vecs: Const<IVec2>[]): Box2 => expandByVecs(clone(self), vecs);
  export const expandByScalar = (self: Box2, scalar: number): Box2 => {
    self.min.x -= scalar;
    self.min.y -= scalar;
    self.max.x += scalar;
    self.max.y += scalar;

    return self;
  };
  export const expandedByScalar = (self: Const<Box2>, scalar: number): Box2 => expandByScalar(clone(self), scalar);

  export const fromVecs = (vecs: Const<IVec2>[]): Box2 => expandByVecs(empty(), vecs);
  export const fromCenterAndSize = (center: Const<IVec2>, size: Const<IVec2>): Box2 =>
    fromCenterAndSize_(center, size, empty());
  export const fromCenterAndSize_ = (center: Const<IVec2>, size: Const<IVec2>, into: Box2): Box2 => {
    const halfSizeX = size.x / 2;
    const halfSizeY = size.y / 2;

    return set(into, center.x - halfSizeX, center.y - halfSizeY, center.x + halfSizeX, center.y + halfSizeY);
  };

  export const contains = (self: Const<Box2>, box: Const<Box2>): boolean =>
    self.min.x <= box.min.x && box.max.x <= self.max.x && self.min.y <= box.min.y && box.max.y <= self.max.y;

  export const containsVec = (self: Const<Box2>, { x, y }: Const<IVec2>): boolean =>
    !(x < self.min.x || x > self.max.x || y < self.min.y || y > self.max.y);

  export const intersects = (self: Const<Box2>, box: Const<Box2>): boolean =>
    box.max.x >= self.min.x && box.min.x <= self.max.x && box.max.y >= self.min.y && box.min.y <= self.max.y;

  export const clampVec = (self: Const<Box2>, { x, y }: Const<IVec2>): IVec2 =>
    vec2(clamp(x, self.min.x, self.max.x), clamp(y, self.min.y, self.max.y));
  export const clampVec_ = (self: Const<Box2>, { x, y }: Const<IVec2>, into: IVec2): IVec2 => {
    into.x = clamp(x, self.min.x, self.max.x);
    into.y = clamp(y, self.min.y, self.max.y);

    return into;
  };

  export const intersect = (self: Box2, box: Const<Box2>): Box2 => {
    if (box.min.x > self.min.x) self.min.x = box.min.x;
    if (box.min.y > self.min.y) self.min.y = box.min.y;
    if (box.max.x < self.max.x) self.max.x = box.max.x;
    if (box.max.y < self.max.y) self.max.y = box.max.y;

    return self;
  };
  export const intersected = (self: Const<Box2>, box: Const<Box2>): Box2 => intersect(clone(self), box);

  export const union = (self: Box2, box: Const<Box2>): Box2 => {
    if (box.min.x < self.min.x) self.min.x = box.min.x;
    if (box.min.y < self.min.y) self.min.y = box.min.y;
    if (box.max.x > self.max.x) self.max.x = box.max.x;
    if (box.max.y > self.max.y) self.max.y = box.max.y;

    return self;
  };
  export const union_ = (self: Const<Box2>, box: Const<Box2>, into: Box2): Box2 => {
    if (box.min.x < self.min.x) into.min.x = box.min.x;
    if (box.min.y < self.min.y) into.min.y = box.min.y;
    if (box.max.x > self.max.x) into.max.x = box.max.x;
    if (box.max.y > self.max.y) into.max.y = box.max.y;

    return into;
  };
  export const united = (self: Const<Box2>, box: Const<Box2>): Box2 => union(clone(self), box);

  export const translate = (self: Box2, vec: Const<IVec2>): Box2 => translate_(self, vec, self);
  export const translate_ = (self: Const<Box2>, { x, y }: Const<IVec2>, into: Box2): Box2 =>
    set(into, self.min.x + x, self.min.y + y, self.max.x + x, self.max.y + y);
  export const translated = (self: Const<Box2>, vec: Const<IVec2>): Box2 => translate(clone(self), vec);

  export const distanceSqTo = (self: Const<Box2>, vec: Const<IVec2>): number => {
    const x = clamp(vec.x, self.min.x, self.max.x) - vec.x;
    const y = clamp(vec.y, self.min.y, self.max.y) - vec.y;

    return x * x + y * y;
  };
  export const distanceTo = (self: Const<Box2>, vec: Const<IVec2>): number => Math.sqrt(distanceSqTo(self, vec));

  export const equals = (a: Const<Box2>, b: Const<Box2>): boolean =>
    b.min.x === a.min.x && b.min.y === a.min.y && b.max.x === a.max.x && b.max.y === a.max.y;
}
