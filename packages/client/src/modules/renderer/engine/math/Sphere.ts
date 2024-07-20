import { Box3, Box3_ } from './Box3.js';
import { IVec3, Vec3 } from './Vector3.js';
import { Plane, Plane_ } from './Plane.js';
import type { Matrix4 } from './Matrix4.js';
import type { Const } from './types.ts';

export class Sphere {
  declare isSphere: true;
  declare ['constructor']: typeof Sphere;

  constructor(
    public center: Vec3 = Vec3.new(),
    public radius: number = -1,
  ) {}

  static new(center: Vec3 = Vec3.new(), radius: number = -1): Sphere {
    return new Sphere(center, radius);
  }

  static empty(): Sphere {
    return Sphere.new();
  }

  static clone(sphere: Const<Sphere>, into: Sphere = Sphere.empty()): Sphere {
    return into.from(sphere);
  }

  static is(sphere: any): sphere is Sphere {
    return sphere?.isSphere === true;
  }

  static into(into: Sphere, sphere: Const<Sphere>): Sphere {
    return into.from(sphere);
  }

  static from(sphere: Const<Sphere>, into: Sphere = Sphere.empty()): Sphere {
    return into.from(sphere);
  }

  static fromParams(
    centerX: number,
    centerY: number,
    centerZ: number,
    radius: number,
    into: Sphere = Sphere.empty(),
  ): Sphere {
    return into.setParams(centerX, centerY, centerZ, radius);
  }

  static fromCoords(coords: Vec3[], center?: Const<Vec3>, into: Sphere = Sphere.new()): Sphere {
    return into.fromCoords(coords, center);
  }

  set(center: Const<Vec3>, radius: number): this {
    this.center.from(center);
    this.radius = radius;

    return this;
  }

  setCenter(center: Const<Vec3>): this {
    this.center.from(center);
    return this;
  }

  setRadius(radius: number): this {
    this.radius = radius;
    return this;
  }

  setParams(centerX: number, centerY: number, centerZ: number, radius: number): this {
    this.center.set(centerX, centerY, centerZ);
    this.radius = radius;
    return this;
  }

  from(sphere: Const<Sphere>): this {
    return this.set(sphere.center, sphere.radius);
  }

  fromCoords(coords: Vec3[], center: Vec3 = this.center): Sphere {
    if (center !== this.center) {
      this.center.from(center);
    } else {
      Box3.fromCoords(coords).center(this.center);
    }

    let maxRadiusSq = 0;
    for (let i = 0, il = coords.length; i < il; i++) {
      const distance = coords[i].distanceSqTo(center);
      if (distance > maxRadiusSq) maxRadiusSq = distance;
    }

    this.radius = Math.sqrt(maxRadiusSq);

    return this;
  }

  isEmpty(): boolean {
    return this.radius < 0;
  }

  clear(): this {
    this.center.set(0, 0, 0);
    this.radius = -1;
    return this;
  }

  containsVec(point: Const<Vec3>): boolean {
    return point.distanceSqTo(this.center) <= this.radius * this.radius;
  }

  distanceTo(point: Const<Vec3>): number {
    return point.distanceTo(this.center) - this.radius;
  }

  intersects(sphere: Const<Sphere>): boolean {
    const radiusSum = this.radius + sphere.radius;

    return sphere.center.distanceSqTo(this.center) <= radiusSum * radiusSum;
  }

  intersectsBox(box: Const<Box3>): boolean {
    return box.intersectsSphere(this);
  }

  intersectsPlane(plane: Const<Plane>): boolean {
    return Math.abs(plane.distanceToPoint(this.center)) <= this.radius;
  }

  clamp(vec: Const<Vec3>, into: Vec3 = Vec3.new()): Vec3 {
    const deltaLengthSq = this.center.distanceSqTo(vec);
    into.from(vec);

    if (deltaLengthSq > this.radius * this.radius) {
      into.sub(this.center).normalize();
      into.scale(this.radius).add(this.center);
    }

    return into;
  }

  bbox(into: Box3 = Box3.new()): Box3 {
    if (this.isEmpty()) return into.clear();

    into.set(this.center, this.center);
    into.expandScalar(this.radius);

    return into;
  }

  applyMat4(matrix: Const<Matrix4>): this {
    this.center.applyMat4(matrix);
    this.radius = this.radius * matrix.getMaxScaleOnAxis();

    return this;
  }

  translate(offset: Const<Vec3>): this {
    this.center.add(offset);

    return this;
  }

  expandCoord(point: Const<Vec3>): this {
    if (this.isEmpty()) return this.set(point, 0);
    const offset = Vec3.from(point).sub(this.center);

    const lengthSq = offset.lengthSq();
    if (lengthSq > this.radius * this.radius) {
      const length = Math.sqrt(lengthSq);

      const delta = (length - this.radius) * 0.5;

      this.center.addScaled(offset, delta / length);
      this.radius += delta;
    }

    return this;
  }

  union(sphere: Const<Sphere>): this {
    if (sphere.isEmpty()) return this;
    if (this.isEmpty()) return this.from(sphere);

    if (this.center.equals(sphere.center)) {
      this.radius = Math.max(this.radius, sphere.radius);
    } else {
      const _v2 = Vec3.from(sphere.center).sub(this.center).setLength(sphere.radius);

      this.expandCoord(Vec3.from(sphere.center).add(_v2));
      this.expandCoord(Vec3.from(sphere.center).sub(_v2));
    }

    return this;
  }

  equals(sphere: Const<Sphere>): boolean {
    return sphere.center.equals(this.center) && sphere.radius === this.radius;
  }
}

Sphere.prototype.isSphere = true;

export interface Sphere_ {
  center: Vec3;
  radius: number;
}

export namespace Sphere_ {
  export const create = (centerX: number, centerY: number, centerZ: number, radius: number): Sphere_ => ({
    center: IVec3.create(centerX, centerY, centerZ),
    radius,
  });
  export const sphere = create;

  export const empty = (): Sphere_ => ({ center: IVec3.create(0, 0, 0), radius: -1 });
  export const clear = (self: Sphere_): Sphere_ => set(self, 0, 0, 0, -1);

  export const set = (self: Sphere_, centerX: number, centerY: number, centerZ: number, radius: number): Sphere_ => {
    IVec3.set(self.center, centerX, centerY, centerZ);
    self.radius = radius;

    return self;
  };
  export const fill_ = (self: Sphere_, { center: { x, y, z }, radius }: Const<Sphere_>): Sphere_ =>
    set(self, x, y, z, radius);

  export const copy = (from: Const<Sphere_>): Sphere_ => copy_(from, empty());
  export const copy_ = ({ center, radius }: Const<Sphere_>, into: Sphere_): Sphere_ => {
    into.center = center;
    into.radius = radius;

    return into;
  };

  export const clone = (from: Const<Sphere_>): Sphere_ => clone_(from, empty());
  export const clone_ = (from: Const<Sphere_>, into: Sphere_): Sphere_ => fill_(into, from);

  export const fromVecs = (vecs: Const<IVec3>[]): Sphere_ => fromVecs_(vecs, empty());

  const _box: Box3_ = { min: IVec3.empty(), max: IVec3.empty() };
  const _vec = IVec3.empty();
  export const fromVecs_ = (vecs: Const<IVec3>[], into: Sphere_): Sphere_ => {
    const center = Box3_.center_(Box3_.fromCoords_(vecs, _box), _vec);

    let maxRadiusSq = 0;
    for (let i = 0, il = vecs.length; i < il; i++) {
      const radiusSq = IVec3.distanceSqTo(center, vecs[i]);
      if (radiusSq > maxRadiusSq) maxRadiusSq = radiusSq;
    }

    const radius = Math.sqrt(maxRadiusSq);

    return set(into, center.x, center.y, center.z, radius);
  };
  export const fillVecs = (self: Sphere_, vecs: Const<IVec3>[]): Sphere_ => fromVecs_(vecs, self);

  export const isEmpty = ({ radius }: Sphere_): boolean => radius < 0;
  export const containsVec = ({ center, radius }: Const<Sphere_>, vec: Const<IVec3>): boolean =>
    IVec3.distanceSqTo(center, vec) <= radius * radius;

  export const distanceToVec = ({ center, radius }: Const<Sphere_>, vec: Const<IVec3>): number =>
    IVec3.distanceTo(center, vec) - radius;

  export const intersects = (a: Const<Sphere_>, b: Const<Sphere_>): boolean => {
    const radius = a.radius + b.radius;

    return IVec3.distanceSqTo(a.center, b.center) <= radius * radius;
  };
  export const intersectsBox = (self: Const<Sphere_>, box: Const<Box3_>): boolean => Box3_.intersectsSphere(box, self);
  export const intersectsPlane = (self: Const<Sphere_>, plane: Const<Plane_>): boolean =>
    Math.abs(Plane_.distanceToVec(plane, self.center)) <= self.radius;

  export const bbox = (self: Const<Sphere_>): Box3_ => bbox_(self, Box3_.empty());
  export const bbox_ = (self: Const<Sphere_>, into: Box3_): Box3_ => {
    if (isEmpty(self)) return Box3_.clear(into);

    return Box3_.fillCenterAndRadius(into, self.center, self.radius);
  };

  export const union = (self: Sphere_, sphere: Const<Sphere_>): Sphere_ => union_(self, sphere, self);
  export const union_ = (self: Const<Sphere_>, sphere: Const<Sphere_>, into: Sphere_): Sphere_ => {
    if (isEmpty(sphere)) return clone_(sphere, into);
    if (isEmpty(self)) return clone_(self, into);

    if (IVec3.equals(self.center, sphere.center)) {
      into.radius = Math.max(self.radius, sphere.radius);
    } else {
      const offset = IVec3.sub_(sphere.center, self.center, IVec3.temp0);
      IVec3.normalize(offset);
      IVec3.scale(offset, sphere.radius);

      expandByVec(into, IVec3.add_(sphere.center, offset, IVec3.temp1));
      expandByVec(into, IVec3.sub_(sphere.center, offset, IVec3.temp1));
    }

    return into;
  };
  export const united = (self: Const<Sphere_>, sphere: Const<Sphere_>): Sphere_ => union_(self, sphere, empty());

  export const expandByVec = (self: Sphere_, vec: Const<IVec3>): Sphere_ => expandByVec_(self, vec, self);
  export const expandByVec_ = (self: Const<Sphere_>, vec: Const<IVec3>, into: Sphere_): Sphere_ => {
    if (isEmpty(self)) return clear(into);

    const offset = IVec3.sub_(vec, self.center, IVec3.temp2);
    const lengthSq = IVec3.lengthSq(offset);
    if (lengthSq > self.radius * self.radius) {
      const length = Math.sqrt(lengthSq);
      const delta = (length - self.radius) * 0.5;
      IVec3.scale(offset, delta / length);

      IVec3.add_(into.center, offset, into.center);
      into.radius = self.radius + delta;

      return into;
    }

    return into;
  };
  export const expandedByVec = (self: Const<Sphere_>, vec: Const<IVec3>): Sphere_ => expandByVec_(self, vec, empty());

  export const clampVec = (self: Const<Sphere_>, vec: IVec3) => clampVec_(self, vec, vec);
  export const clampVec_ = (self: Const<Sphere_>, vec: Const<IVec3>, into: IVec3): IVec3 => {
    const lenSq = IVec3.distanceSqTo(self.center, vec);

    IVec3.clone_(vec, into);
    if (lenSq > self.radius * self.radius) {
      IVec3.sub(into, self.center);
      IVec3.normalize(into);
      IVec3.scale(into, self.radius);
      IVec3.add(into, self.center);
    }

    return into;
  };

  export const applyMat4 = (self: Sphere_, mat: Const<Matrix4>): Sphere_ => applyMat4_(self, mat, self);
  export const applyMat4_ = (self: Const<Sphere_>, mat: Const<Matrix4>, into: Sphere_): Sphere_ => {
    const { x, y, z } = IVec3.applyMat4_(self.center, mat, IVec3.temp0);
    const radius = self.radius * mat.getMaxScaleOnAxis();

    return set(into, x, y, z, radius);
  };

  export const translate = (self: Sphere_, vec: IVec3): Sphere_ => translate_(self, vec, self);
  export const translate_ = (self: Const<Sphere_>, vec: Const<IVec3>, into: Sphere_): Sphere_ => {
    const { x, y, z } = IVec3.add_(self.center, vec, IVec3.temp0);

    return set(into, x, y, z, self.radius);
  };
  export const translated = (self: Const<Sphere_>, vec: Const<IVec3>): Sphere_ => translate_(self, vec, empty());

  export const equals = (a: Const<Sphere_>, b: Const<Sphere_>): boolean =>
    IVec3.equals(a.center, b.center) && a.radius === b.radius;

  export const is = (o: any): o is Sphere_ => IVec3.is(o.center) && typeof o?.radius === 'number';
}
