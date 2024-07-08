import { Vec3, Vector3 } from './Vector3.js';
import { Box3, Box3_ } from '@modules/renderer/engine/math/Box3.js';

export class Capsule {
  declare ['constructor']: typeof Capsule;
  declare isCapsule: true;

  constructor(
    public start: Vector3 = new Vector3(0, 0, 0),
    public end: Vector3 = new Vector3(0, 1, 0),
    public radius: number = 1,
  ) {}

  clone(): Capsule {
    return new Capsule(this.start.clone(), this.end.clone(), this.radius);
  }

  set(start: Vector3, end: Vector3, radius: number): this {
    this.start.copy(start);
    this.end.copy(end);
    this.radius = radius;

    return this;
  }

  copy(capsule: Capsule): this {
    this.start.copy(capsule.start);
    this.end.copy(capsule.end);
    this.radius = capsule.radius;

    return this;
  }

  getCenter(target: Vector3): Vector3 {
    return target.copy(this.end).add(this.start).multiplyScalar(0.5);
  }

  translate(v: Vector3): this {
    this.start.add(v);
    this.end.add(v);

    return this;
  }

  checkAABBAxis(
    p1x: number,
    p1y: number,
    p2x: number,
    p2y: number,
    minx: number,
    maxx: number,
    miny: number,
    maxy: number,
    radius: number,
  ): boolean {
    return (
      (minx - p1x < radius || minx - p2x < radius) &&
      (p1x - maxx < radius || p2x - maxx < radius) &&
      (miny - p1y < radius || miny - p2y < radius) &&
      (p1y - maxy < radius || p2y - maxy < radius)
    );
  }

  intersectsBox(box: Box3): boolean {
    return (
      this.checkAABBAxis(
        this.start.x,
        this.start.y,
        this.end.x,
        this.end.y,
        box.min.x,
        box.max.x,
        box.min.y,
        box.max.y,
        this.radius,
      ) &&
      this.checkAABBAxis(
        this.start.x,
        this.start.z,
        this.end.x,
        this.end.z,
        box.min.x,
        box.max.x,
        box.min.z,
        box.max.z,
        this.radius,
      ) &&
      this.checkAABBAxis(
        this.start.y,
        this.start.z,
        this.end.y,
        this.end.z,
        box.min.y,
        box.max.y,
        box.min.z,
        box.max.z,
        this.radius,
      )
    );
  }
}

Capsule.prototype.isCapsule = true;

export interface Capsule_ {
  start: Vec3;
  end: Vec3;
  radius: number;
}

export namespace Capsule_ {
  export const create = (
    startX: number,
    startY: number,
    startZ: number,
    endX: number,
    endY: number,
    endZ: number,
    radius: number,
  ): Capsule_ => ({
    start: Vec3.create(startX, startY, startZ),
    end: Vec3.create(endX, endY, endZ),
    radius,
  });
  export const empty = (): Capsule_ => create(0, 0, 0, 0, 0, 0, 0);

  export const fill = (
    self: Capsule_,
    startX: number,
    startY: number,
    startZ: number,
    endX: number,
    endY: number,
    endZ: number,
    radius: number,
  ): Capsule_ => {
    self.start.x = startX;
    self.start.y = startY;
    self.start.z = startZ;
    self.end.x = endX;
    self.end.y = endY;
    self.end.z = endZ;
    self.radius = radius;

    return self;
  };
  export const fill_ = ({ start, end, radius }: Readonly<Capsule_>, into: Capsule_): Capsule_ =>
    fill(into, start.x, start.y, start.z, end.x, end.y, end.z, radius);

  export const translate = (capsule: Capsule_, vec: Vec3): Capsule_ => translate_(capsule, vec, capsule);
  export const translate_ = (self: Capsule_, vec: Vec3, into: Capsule_): Capsule_ => {
    Vec3.add_(self.start, vec, into.start);
    Vec3.add_(self.end, vec, into.end);

    return into;
  };
  export const translated = (capsule: Capsule_, vec: Vec3): Capsule_ => translate(fill_(capsule, empty()), vec);

  export const clone = ({ start, end, radius }: Readonly<Capsule_>): Capsule_ => ({ start, end, radius });
  export const copy = ({ start, end, radius }: Readonly<Capsule_>): Capsule_ => ({
    start: Vec3.copy(start),
    end: Vec3.copy(end),
    radius,
  });

  export const center = (capsule: Readonly<Capsule_>): Vec3 => center_(capsule, Vec3.empty());
  export const center_ = ({ start, end }: Readonly<Capsule_>, into: Vec3): Vec3 =>
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

  export const intersectsBox = ({ start, end, radius }: Readonly<Capsule_>, { min, max }: Readonly<Box3_>): boolean =>
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
