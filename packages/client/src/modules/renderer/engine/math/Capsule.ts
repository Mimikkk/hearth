import { IVec3, Vec3 } from './Vector3.js';
import { Box3_ } from '@modules/renderer/engine/math/Box3.js';
import { as, Const } from '@modules/renderer/engine/math/types.js';

export class Capsule implements ICapsule {
  constructor(
    public start: Vec3,
    public end: Vec3,
    public radius: number,
  ) {}

  static new(start: Vec3, end: Vec3, radius: number): Capsule {
    return new C(start, end, radius);
  }

  static empty(): Capsule {
    return C.new(Vec3.empty(), Vec3.empty(), 0);
  }

  static clone<S extends T>(from: Const<T>, into: S = I.empty()): S {
    return I.from.self(from, into);
  }

  static copy<S extends T>(from: Const<T>, into: S = I.empty()): S {
    return I.copy(from, into);
  }

  static fromEnds<S extends T>(start: Const<IVec3>, end: Const<IVec3>, radius: number, into: S = I.empty()): S {
    return I.from.ends(start, end, radius, into);
  }

  fill(from: Const<T>): this {
    return I.from.self(from, this);
  }

  fillEnds(start: Const<IVec3>, end: Const<IVec3>, radius: number): this {
    return I.from.ends(start, end, radius, this);
  }

  set(startX: number, startY: number, startZ: number, endX: number, endY: number, endZ: number, radius: number): this {
    return I.fill(this, startX, startY, startZ, endX, endY, endZ, radius);
  }

  setEnds(start: Const<IVec3>, end: Const<IVec3>): this {
    return I.from.ends(start, end, this.radius, this);
  }

  setStart(start: Const<IVec3>): this {
    return I.set.start(this, start);
  }

  setEnd(end: Const<IVec3>): this {
    return I.set.end(this, end);
  }

  setRadius(radius: number): this {
    return I.set.radius(this, radius);
  }

  translate<S extends T>(vec: Const<IVec3>, into: S = as(this)): S {
    return I.translate(this, vec, into);
  }

  center<T extends IVec3>(into: T = Vec3.empty()): T {
    return I.center(this, into);
  }

  intersectsBox(box: Const<Box3_>): boolean {
    return I.intersectsBox(this, box);
  }
}

export interface ICapsule {
  start: IVec3;
  end: IVec3;
  radius: number;
}

export namespace ICapsule {
  export const create = Capsule.new as <S extends T>(start: Vec3, end: Vec3, radius: number) => S;
  export const empty = Capsule.empty as <S extends T>() => S;

  export const fill = <S extends T>(
    into: S,
    startX: number,
    startY: number,
    startZ: number,
    endX: number,
    endY: number,
    endZ: number,
    radius: number,
  ): S => {
    into.start.x = startX;
    into.start.y = startY;
    into.start.z = startZ;
    into.end.x = endX;
    into.end.y = endY;
    into.end.z = endZ;
    into.radius = radius;

    return into;
  };

  export namespace set {
    export const start = <S extends T>(self: S, start: Const<IVec3>): S => {
      IVec3.fill(self.start, start);
      return self;
    };

    export const end = <S extends T>(self: S, end: Const<IVec3>): S => {
      IVec3.fill(self.end, end);
      return self;
    };

    export const radius = <S extends T>(self: S, radius: number): S => {
      self.radius = radius;
      return self;
    };
  }

  export namespace from {
    export const self = <S extends T>({ start, end, radius }: Const<T>, into: S = empty()): S =>
      fill(into, start.x, start.y, start.z, end.x, end.y, end.z, radius);

    export const ends = <S extends T>(start: Const<IVec3>, end: Const<IVec3>, radius: number, into: S = empty()): S =>
      fill(into, start.x, start.y, start.z, end.x, end.y, end.z, radius);
  }

  export const clone = from.self;

  export const copy = <S extends T>(self: Const<ICapsule>, into: S = empty()): S => {
    into.start = self.start;
    into.end = self.end;
    into.radius = self.radius;

    return into;
  };

  export const translate = <S extends T>(capsule: Const<ICapsule>, vec: Const<IVec3>, into: S = capsule as S): S => {
    IVec3.add_(capsule.start, vec, into.start);
    IVec3.add_(capsule.end, vec, into.end);

    return into;
  };

  export const center = <S extends IVec3>({ start, end }: Const<ICapsule>, into: S = IVec3.empty()): S => {
    IVec3.add_(start, end, into);
    IVec3.scale(into, 0.5);

    return into;
  };

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

  export const intersectsBox = ({ start, end, radius }: Const<ICapsule>, { min, max }: Const<Box3_>): boolean =>
    isAABBAxis(start.x, start.y, end.x, end.y, min.x, max.x, min.y, max.y, radius) &&
    isAABBAxis(start.x, start.z, end.x, end.z, min.x, max.x, min.z, max.z, radius) &&
    isAABBAxis(start.y, start.z, end.y, end.z, min.y, max.y, min.z, max.z, radius);
}

const I = ICapsule;
const C = Capsule;
type T = ICapsule;
