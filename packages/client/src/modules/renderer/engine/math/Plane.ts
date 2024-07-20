import { Matrix3 } from './Matrix3.js';
import { Vec3, Vector3 } from './Vector3.js';
import { Sphere, Sphere_ } from './Sphere.js';
import { Line3 } from './Line3.js';
import { Box3, Box3_ } from './Box3.js';
import type { Matrix4 } from './Matrix4.js';
import { Const } from '@modules/renderer/engine/math/types.js';

export class Plane {
  declare ['constructor']: typeof Plane;
  declare isPlane: true;

  constructor(
    public normal: Vector3 = new Vector3(1, 0, 0),
    public constant: number = 0,
  ) {}

  set(normal: Vector3, constant: number): this {
    this.normal.copy(normal);
    this.constant = constant;

    return this;
  }

  setComponents(x: number, y: number, z: number, w: number): this {
    this.normal.set(x, y, z);
    this.constant = w;

    return this;
  }

  setFromNormalAndCoplanarPoint(normal: Vector3, point: Vector3): this {
    this.normal.copy(normal);
    this.constant = -point.dot(this.normal);

    return this;
  }

  setFromCoplanarPoints(a: Vector3, b: Vector3, c: Vector3): this {
    const normal = new Vector3().subVectors(c, b).cross(new Vector3().subVectors(a, b)).normalize();

    // Q: should an error be thrown if normal is zero (e.g. degenerate this)?

    this.setFromNormalAndCoplanarPoint(normal, a);

    return this;
  }

  copy(plane: Plane): this {
    this.normal.copy(plane.normal);
    this.constant = plane.constant;

    return this;
  }

  normalize(): this {
    // Note: will lead to a divide by zero if the plane is invalid.

    const inverseNormalLength = 1.0 / this.normal.length();
    this.normal.multiplyScalar(inverseNormalLength);
    this.constant *= inverseNormalLength;

    return this;
  }

  negate(): this {
    this.constant *= -1;
    this.normal.negate();

    return this;
  }

  distanceToPoint(point: Vec3): number {
    return Vec3.dot(this.normal, point) + this.constant;
  }

  distanceToSphere(sphere: Sphere_): number {
    return this.distanceToPoint(sphere.center) - sphere.radius;
  }

  projectPoint(point: Vector3, target: Vector3): Vector3 {
    return target.copy(point).addScaledVector(this.normal, -this.distanceToPoint(point));
  }

  intersectLine(line: Line3, target: Vector3): Vector3 | null {
    const direction = Line3.delta(line);

    const denominator = Vec3.dot(this.normal, direction);

    if (denominator === 0) {
      // line is coplanar, return origin
      if (this.distanceToPoint(line.start) === 0) {
        Vec3.fill_(target, line.start);
        return target;
      }

      // Unsure if this is the correct method to handle this case.
      return null;
    }

    const t = -(Vec3.dot(line.start, this.normal) + this.constant) / denominator;

    if (t < 0 || t > 1) {
      return null;
    }

    Vec3.fill_(target, line.start);
    return target.addScaledVector(direction, t);
  }

  intersectsLine(line: Line3): boolean {
    // Note: this tests if a line intersects the plane, not whether it (or its end-points) are coplanar with it.

    const startSign = this.distanceToPoint(line.start);
    const endSign = this.distanceToPoint(line.end);

    return (startSign < 0 && endSign > 0) || (endSign < 0 && startSign > 0);
  }

  intersectsBox(box: Box3): boolean {
    return box.intersectsPlane(this);
  }

  intersectsSphere(sphere: Sphere): boolean {
    return sphere.intersectsPlane(this);
  }

  coplanarPoint(target: Vector3): Vector3 {
    return target.copy(this.normal).multiplyScalar(-this.constant);
  }

  applyMatrix4(matrix: Matrix4, optionalNormalMatrix?: Matrix3): Plane {
    const normalMatrix = optionalNormalMatrix || new Matrix3().getNormalMatrix(matrix);

    const referencePoint = this.coplanarPoint(new Vector3()).applyMatrix4(matrix);

    const normal = this.normal.applyMatrix3(normalMatrix).normalize();

    this.constant = -referencePoint.dot(normal);

    return this;
  }

  translate(offset: Vector3): Plane {
    this.constant -= offset.dot(this.normal);

    return this;
  }

  equals(plane: Plane): boolean {
    return plane.normal.equals(this.normal) && plane.constant === this.constant;
  }

  clone(): Plane {
    return new this.constructor().copy(this);
  }
}

Plane.prototype.isPlane = true;

export interface Plane_ {
  normal: Vec3;
  constant: number;
}

export namespace Plane_ {
  export const create = (normalX: number, normalY: number, normalZ: number, constant: number): Plane_ => ({
    normal: Vec3.create(normalX, normalY, normalZ),
    constant,
  });
  export const empty = (): Plane_ => create(0, 0, 0, 0);

  export const set = (self: Plane_, normalX: number, normalY: number, normalZ: number, constant: number): Plane_ => {
    self.normal.x = normalX;
    self.normal.y = normalY;
    self.normal.z = normalZ;
    self.constant = constant;

    return self;
  };
  export const fill_ = (self: Plane_, { constant, normal: { x, y, z } }: Const<Plane_>): Plane_ =>
    set(self, x, y, z, constant);

  export const clone = (from: Const<Plane_>): Plane_ => clone_(from, empty());
  export const clone_ = (from: Const<Plane_>, into: Plane_): Plane_ => fill_(into, from);

  export const copy = (from: Const<Plane_>): Plane_ => copy_(from, empty());
  export const copy_ = ({ normal, constant }: Const<Plane_>, into: Plane_): Plane_ => {
    into.normal = normal;
    into.constant = constant;

    return into;
  };

  export const normalize = (self: Plane_): Plane_ => normalize_(self, self);
  export const normalize_ = (from: Const<Plane_>, into: Plane_): Plane_ => {
    const length = 1.0 / Vec3.length(from.normal);
    Vec3.mulScalar_(from.normal, length, into.normal);
    into.constant = from.constant * length;

    return into;
  };
  export const normalized = (from: Const<Plane_>): Plane_ => normalize_(from, empty());

  export const negate = (self: Plane_): Plane_ => negate_(self, self);
  export const negate_ = (from: Const<Plane_>, into: Plane_): Plane_ => {
    into.constant = -from.constant;
    Vec3.negate_(from.normal, into.normal);

    return into;
  };
  export const negated = (from: Const<Plane_>): Plane_ => negate_(from, empty());

  export const translate = (self: Plane_, offset: Const<Vec3>): Plane_ => translate_(self, offset, self);
  export const translate_ = (from: Const<Plane_>, offset: Const<Vec3>, into: Plane_): Plane_ => {
    into.constant -= Vec3.dot(offset, from.normal);

    return into;
  };
  export const translated = (from: Const<Plane_>, offset: Const<Vec3>): Plane_ => translate_(from, offset, clone(from));

  export const coplanar = (self: Const<Plane_>): Vec3 => coplanar_(self, Vec3.empty());
  export const coplanar_ = (self: Const<Plane_>, into: Vec3): Vec3 =>
    Vec3.mulScalar_(self.normal, -self.constant, into);

  export const fromNormalAndCoplanar = (normal: Const<Vec3>, coplanar: Const<Vec3>): Plane_ =>
    fromNormalAndCoplanar_(normal, coplanar, empty());
  export const fromNormalAndCoplanar_ = (normal: Const<Vec3>, coplanar: Const<Vec3>, into: Plane_): Plane_ => {
    Vec3.fill_(into.normal, normal);
    into.constant = -Vec3.dot(coplanar, normal);

    return into;
  };
  export const fillFromNormalAndCoplanar_ = (self: Plane_, normal: Const<Vec3>, coplanar: Const<Vec3>): Plane_ =>
    fromNormalAndCoplanar_(normal, coplanar, self);

  const _vec1 = Vec3.empty();
  const _vec2 = Vec3.empty();
  export const fromCoplanar = (a: Const<Vec3>, b: Const<Vec3>, c: Const<Vec3>): Plane_ =>
    fromCoplanar_(a, b, c, empty());
  export const fromCoplanar_ = (a: Const<Vec3>, b: Const<Vec3>, c: Const<Vec3>, into: Plane_): Plane_ => {
    Vec3.sub_(c, b, _vec1);
    Vec3.sub_(a, b, _vec2);
    Vec3.cross_(_vec1, _vec2, into.normal);
    Vec3.normalize(into.normal);

    return fromNormalAndCoplanar_(into.normal, a, into);
  };
  export const fillCoplanar = (self: Plane_, a: Const<Vec3>, b: Const<Vec3>, c: Const<Vec3>): Plane_ =>
    fromCoplanar_(a, b, c, self);

  const _mat3 = new Matrix3();
  export const applyMat4 = (self: Plane_, mat: Const<Matrix4>): Plane_ => applyMat4_(self, mat, self);
  export const applyMat4_ = (from: Const<Plane_>, mat: Const<Matrix4>, into: Plane_): Plane_ => {
    const reference = Vec3.applyMat4_(from.normal, mat, _vec1);

    const normalMat = _mat3.getNormalMatrix(mat);
    Vec3.applyMat3_(from.normal, normalMat, into.normal);
    Vec3.normalize(into.normal);
    into.constant = -Vec3.dot(reference, into.normal);

    return into;
  };

  export const distanceToVec = (self: Const<Plane_>, point: Const<Vec3>): number =>
    Vec3.dot(self.normal, point) + self.constant;
  export const distanceToSphere = (self: Const<Plane_>, sphere: Const<Sphere_>): number =>
    distanceToVec(self, sphere.center) - sphere.radius;

  export const project = (self: Const<Plane_>, point: Const<Vec3>): Vec3 => project_(self, point, Vec3.empty());
  export const project_ = (self: Const<Plane_>, point: Const<Vec3>, into: Vec3): Vec3 => {
    Vec3.add_(point, self.normal, into);
    Vec3.mulScalar(into, -distanceToVec(self, point));

    return into;
  };
  export const projected = (self: Const<Plane_>, point: Const<Vec3>): Vec3 => project_(self, point, Vec3.empty());

  export const intersectLine = (self: Const<Plane_>, line: Const<Line3>): Vec3 | null =>
    intersectLine_(self, line, Vec3.empty());
  export const intersectLine_ = (self: Const<Plane_>, line: Const<Line3>, into: Vec3): Vec3 | null => {
    const direction = Line3.delta_(line, _vec1);
    const denominator = Vec3.dot(self.normal, direction);

    if (denominator === 0) {
      if (distanceToVec(self, line.start) === 0) return Vec3.clone_(line.start, into);
      return null;
    }

    const step = -(Vec3.dot(line.start, self.normal) + self.constant) / denominator;
    if (step < 0 || step > 1) return null;

    Vec3.mulScalar(direction, step);
    Vec3.add_(line.start, direction, into);
    return into;
  };

  export const intersectsLine = (self: Const<Plane_>, line: Const<Line3>): boolean => {
    const startSign = distanceToVec(self, line.start) > 0 ? 1 : -1;
    const endSign = distanceToVec(self, line.end) > 0 ? 1 : -1;

    return startSign !== endSign;
  };
  export const intersectsBox = (self: Const<Plane_>, box: Const<Box3_>): boolean => Box3_.intersectsPlane(box, self);
  export const intersectsSphere = (self: Const<Plane_>, sphere: Const<Sphere_>): boolean =>
    Sphere_.intersectsPlane(sphere, self);

  export const equals = (a: Const<Plane_>, b: Const<Plane_>): boolean =>
    Vec3.equals(a.normal, b.normal) && a.constant === b.constant;
}
