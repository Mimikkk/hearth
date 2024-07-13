import { Box3, Box3_ } from './Box3.js';
import { Vec3, Vector3 } from './Vector3.js';
import { Plane, Plane_ } from './Plane.js';
import type { Matrix4 } from './Matrix4.js';
import { Const } from './types.ts';

export class Sphere {
  declare isSphere: true;
  declare ['constructor']: typeof Sphere;

  constructor(
    public center: Vector3 = new Vector3(),
    public radius: number = -1,
  ) {}

  set(center: Vector3, radius: number): this {
    this.center.copy(center);
    this.radius = radius;

    return this;
  }

  setFromPoints(points: Vector3[], optionalCenter?: Vector3): Sphere {
    const center = this.center;

    if (optionalCenter !== undefined) {
      center.copy(optionalCenter);
    } else {
      new Box3().setFromPoints(points).getCenter(center);
    }

    let maxRadiusSq = 0;

    for (let i = 0, il = points.length; i < il; i++) {
      maxRadiusSq = Math.max(maxRadiusSq, center.distanceToSquared(points[i]));
    }

    this.radius = Math.sqrt(maxRadiusSq);

    return this;
  }

  copy(sphere: Sphere): this {
    this.center.copy(sphere.center);
    this.radius = sphere.radius;

    return this;
  }

  isEmpty(): boolean {
    return this.radius < 0;
  }

  makeEmpty(): this {
    this.center.set(0, 0, 0);
    this.radius = -1;

    return this;
  }

  containsPoint(point: Vector3): boolean {
    return point.distanceToSquared(this.center) <= this.radius * this.radius;
  }

  distanceToPoint(point: Vector3): number {
    return point.distanceTo(this.center) - this.radius;
  }

  intersectsSphere(sphere: Sphere): boolean {
    const radiusSum = this.radius + sphere.radius;

    return sphere.center.distanceToSquared(this.center) <= radiusSum * radiusSum;
  }

  intersectsBox(box: Box3): boolean {
    return box.intersectsSphere(this);
  }

  intersectsPlane(plane: Plane): boolean {
    return Math.abs(plane.distanceToPoint(this.center)) <= this.radius;
  }

  clampPoint(point: Vector3, target: Vector3): Vector3 {
    const deltaLengthSq = this.center.distanceToSquared(point);

    target.copy(point);

    if (deltaLengthSq > this.radius * this.radius) {
      target.sub(this.center).normalize();
      target.multiplyScalar(this.radius).add(this.center);
    }

    return target;
  }

  getBoundingBox(target: Box3): Box3 {
    if (this.isEmpty()) {
      // Empty sphere produces empty bounding box
      target.makeEmpty();
      return target;
    }

    target.set(this.center, this.center);
    target.expandByScalar(this.radius);

    return target;
  }

  applyMatrix4(matrix: Matrix4): this {
    this.center.applyMatrix4(matrix);
    this.radius = this.radius * matrix.getMaxScaleOnAxis();

    return this;
  }

  translate(offset: Vector3): this {
    this.center.add(offset);

    return this;
  }

  expandByPoint(point: Vector3): this {
    if (this.isEmpty()) {
      this.center.copy(point);
      this.radius = 0;
      return this;
    }

    const _v1 = new Vector3().subVectors(point, this.center);

    const lengthSq = _v1.lengthSq();

    if (lengthSq > this.radius * this.radius) {
      // calculate the minimal sphere

      const length = Math.sqrt(lengthSq);

      const delta = (length - this.radius) * 0.5;

      this.center.addScaledVector(_v1, delta / length);

      this.radius += delta;
    }

    return this;
  }

  union(sphere: Sphere): this {
    if (sphere.isEmpty()) return this;
    if (this.isEmpty()) return this.copy(sphere);

    if (this.center.equals(sphere.center)) {
      this.radius = Math.max(this.radius, sphere.radius);
    } else {
      const _v2 = new Vector3().subVectors(sphere.center, this.center).setLength(sphere.radius);

      this.expandByPoint(new Vector3().copy(sphere.center).add(_v2));
      this.expandByPoint(new Vector3().copy(sphere.center).sub(_v2));
    }

    return this;
  }

  equals(sphere: Sphere): boolean {
    return sphere.center.equals(this.center) && sphere.radius === this.radius;
  }

  clone(): Sphere {
    return new this.constructor().copy(this);
  }
}

Sphere.prototype.isSphere = true;

export interface Sphere_ {
  center: Vec3;
  radius: number;
}

export namespace Sphere_ {
  export const create = (centerX: number, centerY: number, centerZ: number, radius: number): Sphere_ => ({
    center: Vec3.create(centerX, centerY, centerZ),
    radius,
  });
  export const sphere = create;

  export const empty = (): Sphere_ => ({ center: Vec3.create(0, 0, 0), radius: -1 });
  export const clear = (self: Sphere_): Sphere_ => set(self, 0, 0, 0, -1);

  export const set = (self: Sphere_, centerX: number, centerY: number, centerZ: number, radius: number): Sphere_ => {
    Vec3.set(self.center, centerX, centerY, centerZ);
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

  export const fromVecs = (vecs: Const<Vec3>[]): Sphere_ => fromVecs_(vecs, empty());

  const _box: Box3_ = { min: Vec3.empty(), max: Vec3.empty() };
  const _vec = Vec3.empty();
  export const fromVecs_ = (vecs: Const<Vec3>[], into: Sphere_): Sphere_ => {
    const center = Box3_.center_(Box3_.fromVecs_(vecs, _box), _vec);

    let maxRadiusSq = 0;
    for (let i = 0, il = vecs.length; i < il; i++) {
      const radiusSq = Vec3.distanceSqTo(center, vecs[i]);
      if (radiusSq > maxRadiusSq) maxRadiusSq = radiusSq;
    }

    const radius = Math.sqrt(maxRadiusSq);

    return set(into, center.x, center.y, center.z, radius);
  };
  export const fillVecs = (self: Sphere_, vecs: Const<Vec3>[]): Sphere_ => fromVecs_(vecs, self);

  export const isEmpty = ({ radius }: Sphere_): boolean => radius < 0;
  export const containsVec = ({ center, radius }: Const<Sphere_>, vec: Const<Vec3>): boolean =>
    Vec3.distanceSqTo(center, vec) <= radius * radius;

  export const distanceToVec = ({ center, radius }: Const<Sphere_>, vec: Const<Vec3>): number =>
    Vec3.distanceTo(center, vec) - radius;

  export const intersects = (a: Const<Sphere_>, b: Const<Sphere_>): boolean => {
    const radius = a.radius + b.radius;

    return Vec3.distanceSqTo(a.center, b.center) <= radius * radius;
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

    if (Vec3.equals(self.center, sphere.center)) {
      into.radius = Math.max(self.radius, sphere.radius);
    } else {
      const offset = Vec3.sub_(sphere.center, self.center, Vec3.temp0);
      Vec3.normalize(offset);
      Vec3.scale(offset, sphere.radius);

      expandByVec(into, Vec3.add_(sphere.center, offset, Vec3.temp1));
      expandByVec(into, Vec3.sub_(sphere.center, offset, Vec3.temp1));
    }

    return into;
  };
  export const united = (self: Const<Sphere_>, sphere: Const<Sphere_>): Sphere_ => union_(self, sphere, empty());

  export const expandByVec = (self: Sphere_, vec: Const<Vec3>): Sphere_ => expandByVec_(self, vec, self);
  export const expandByVec_ = (self: Const<Sphere_>, vec: Const<Vec3>, into: Sphere_): Sphere_ => {
    if (isEmpty(self)) return clear(into);

    const offset = Vec3.sub_(vec, self.center, Vec3.temp2);
    const lengthSq = Vec3.lengthSq(offset);
    if (lengthSq > self.radius * self.radius) {
      const length = Math.sqrt(lengthSq);
      const delta = (length - self.radius) * 0.5;
      Vec3.scale(offset, delta / length);

      Vec3.add_(into.center, offset, into.center);
      into.radius = self.radius + delta;

      return into;
    }

    return into;
  };
  export const expandedByVec = (self: Const<Sphere_>, vec: Const<Vec3>): Sphere_ => expandByVec_(self, vec, empty());

  export const clampVec = (self: Const<Sphere_>, vec: Vec3) => clampVec_(self, vec, vec);
  export const clampVec_ = (self: Const<Sphere_>, vec: Const<Vec3>, into: Vec3): Vec3 => {
    const lenSq = Vec3.distanceSqTo(self.center, vec);

    Vec3.clone_(vec, into);
    if (lenSq > self.radius * self.radius) {
      Vec3.sub(into, self.center);
      Vec3.normalize(into);
      Vec3.scale(into, self.radius);
      Vec3.add(into, self.center);
    }

    return into;
  };

  export const applyMat4 = (self: Sphere_, mat: Const<Matrix4>): Sphere_ => applyMat4_(self, mat, self);
  export const applyMat4_ = (self: Const<Sphere_>, mat: Const<Matrix4>, into: Sphere_): Sphere_ => {
    const { x, y, z } = Vec3.applyMat4_(self.center, mat, Vec3.temp0);
    const radius = self.radius * mat.getMaxScaleOnAxis();

    return set(into, x, y, z, radius);
  };

  export const translate = (self: Sphere_, vec: Vec3): Sphere_ => translate_(self, vec, self);
  export const translate_ = (self: Const<Sphere_>, vec: Const<Vec3>, into: Sphere_): Sphere_ => {
    const { x, y, z } = Vec3.add_(self.center, vec, Vec3.temp0);

    return set(into, x, y, z, self.radius);
  };
  export const translated = (self: Const<Sphere_>, vec: Const<Vec3>): Sphere_ => translate_(self, vec, empty());

  export const equals = (a: Const<Sphere_>, b: Const<Sphere_>): boolean =>
    Vec3.equals(a.center, b.center) && a.radius === b.radius;

  export const is = (o: any): o is Sphere_ => Vec3.is(o.center) && typeof o?.radius === 'number';
}
