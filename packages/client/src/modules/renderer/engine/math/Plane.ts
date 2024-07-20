import { Mat3 } from './Mat3.js';
import { Vec3 } from './Vec3.js';
import type { Sphere } from './Sphere.js';
import type { Line3 } from './Line3.js';
import type { Box3 } from './Box3.js';
import type { Mat4 } from './Mat4.js';
import type { Const } from '@modules/renderer/engine/math/types.js';

export class Plane {
  declare isPlane: true;

  constructor(
    public normal: Vec3 = new Vec3(1, 0, 0),
    public constant: number = 0,
  ) {}

  static new(normal: Vec3 = Vec3.new(1, 0, 0), constant: number = 0): Plane {
    return new Plane(normal, constant);
  }

  static empty(): Plane {
    return Plane.new();
  }

  static clone(plane: Const<Plane>, into: Plane = Plane.new()): Plane {
    return into.from(plane);
  }

  static is(item: any): item is Plane {
    return item?.isPlane === true;
  }

  static into(into: Plane, from: Const<Plane>): Plane {
    return into.from(from);
  }

  static from(from: Const<Plane>, into: Plane = Plane.new()): Plane {
    return into.from(from);
  }

  static fromParams(
    normalX: number,
    normalY: number,
    normalZ: number,
    constant: number,
    into: Plane = Plane.new(),
  ): Plane {
    return into.setParams(normalX, normalY, normalZ, constant);
  }

  static fromNormalAndCoplanar(normal: Const<Vec3>, point: Const<Vec3>, into: Plane = Plane.new()): Plane {
    return into.fromNormalAndCoplanar(normal, point);
  }

  static fromCoplanar(a: Const<Vec3>, b: Const<Vec3>, c: Const<Vec3>, into: Plane = Plane.new()): Plane {
    return into.fromCoplanar(a, b, c);
  }

  set(normal: Const<Vec3>, constant: number): this {
    this.normal.from(normal);
    this.constant = constant;

    return this;
  }

  from({ normal, constant }: Const<Plane>): this {
    return this.set(normal, constant);
  }

  setParams(normalX: number, normalY: number, normalZ: number, constant: number): this {
    this.normal.set(normalX, normalY, normalZ);
    this.constant = constant;

    return this;
  }

  fromNormalAndCoplanar(normal: Const<Vec3>, point: Const<Vec3>): this {
    this.normal.from(normal);
    this.constant = -point.dot(this.normal);

    return this;
  }

  fromCoplanar(a: Const<Vec3>, b: Const<Vec3>, c: Const<Vec3>): this {
    const normal = Vec3.from(c).sub(b).cross(Vec3.from(a).sub(b)).normalize();
    this.fromNormalAndCoplanar(normal, a);
    return this;
  }

  clone(into: Plane = Plane.new()): Plane {
    return into.from(this);
  }

  normalize(): this {
    // Note: will lead to a divide by zero if the plane is invalid.

    const inverseNormalLength = 1.0 / this.normal.length();
    this.normal.scale(inverseNormalLength);
    this.constant *= inverseNormalLength;

    return this;
  }

  negate(): this {
    this.constant *= -1;
    this.normal.negate();

    return this;
  }

  distanceTo(point: Const<Vec3>): number {
    return this.normal.dot(point) + this.constant;
  }

  distanceToSphere(sphere: Const<Sphere>): number {
    return this.distanceTo(sphere.center) - sphere.radius;
  }

  project(vec: Const<Vec3>, into: Vec3 = Vec3.new()): Vec3 {
    return into.from(vec).addScaled(this.normal, -this.distanceTo(vec));
  }

  intersectLine(line: Const<Line3>, into: Vec3 = Vec3.new()): Vec3 | null {
    const direction = line.delta();

    const denominator = this.normal.dot(direction);

    if (denominator === 0) {
      if (this.distanceTo(line.start) === 0) return into.from(line.start);
      return null;
    }

    const t = -(line.start.dot(this.normal) + this.constant) / denominator;
    if (t < 0 || t > 1) return null;

    return into.from(line.start).addScaled(direction, t);
  }

  intersectsBox(box: Const<Box3>): boolean {
    return box.intersectsPlane(this);
  }

  intersectsLine(line: Const<Line3>): boolean {
    const startSign = this.distanceTo(line.start) > 0 ? 1 : -1;
    const endSign = this.distanceTo(line.end) > 0 ? 1 : -1;

    return startSign !== endSign;
  }

  intersectsSphere(sphere: Const<Sphere>): boolean {
    return sphere.intersectsPlane(this);
  }

  coplanar(into: Vec3 = Vec3.new()): Vec3 {
    return into.from(this.normal).scale(-this.constant);
  }

  applyMat4(matrix: Const<Mat4>, normalMatrix: Const<Mat3> = new Mat3().fromNMat4(matrix)): this {
    const reference = this.coplanar().applyMat4(matrix);
    this.normal.applyMat3(normalMatrix).normalize();
    this.constant = -reference.dot(this.normal);

    return this;
  }

  translate(offset: Const<Vec3>): this {
    this.constant -= offset.dot(this.normal);
    return this;
  }

  equals(plane: Const<Plane>): boolean {
    return plane.normal.equals(this.normal) && plane.constant === this.constant;
  }
}

Plane.prototype.isPlane = true;
