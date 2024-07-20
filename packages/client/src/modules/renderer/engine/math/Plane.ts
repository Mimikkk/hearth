import { Mat3 } from './Mat3.js';
import { Vec3 } from './Vec3.js';
import type { Sphere } from './Sphere.js';
import type { Line3 } from './Line3.js';
import type { Box3 } from './Box3.js';
import type { Mat4 } from './Mat4.js';

export class Plane {
  declare ['constructor']: typeof Plane;
  declare isPlane: true;

  constructor(
    public normal: Vec3 = new Vec3(1, 0, 0),
    public constant: number = 0,
  ) {}

  set(normal: Vec3, constant: number): this {
    this.normal.copy(normal);
    this.constant = constant;

    return this;
  }

  setComponents(x: number, y: number, z: number, w: number): this {
    this.normal.set(x, y, z);
    this.constant = w;

    return this;
  }

  setFromNormalAndCoplanarPoint(normal: Vec3, point: Vec3): this {
    this.normal.copy(normal);
    this.constant = -point.dot(this.normal);

    return this;
  }

  setFromCoplanarPoints(a: Vec3, b: Vec3, c: Vec3): this {
    const normal = new Vec3().subVectors(c, b).cross(new Vec3().subVectors(a, b)).normalize();

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
    return this.normal.dot(point) + this.constant;
  }

  distanceToSphere(sphere: Sphere): number {
    return this.distanceToPoint(sphere.center) - sphere.radius;
  }

  projectPoint(point: Vec3, target: Vec3): Vec3 {
    return target.copy(point).addScaledVector(this.normal, -this.distanceToPoint(point));
  }

  intersectLine(line: Line3, target: Vec3): Vec3 | null {
    const direction = line.delta(new Vec3());

    const denominator = this.normal.dot(direction);

    if (denominator === 0) {
      // line is coplanar, return origin
      if (this.distanceToPoint(line.start) === 0) {
        return target.copy(line.start);
      }

      // Unsure if this is the correct method to handle this case.
      return null;
    }

    const t = -(line.start.dot(this.normal) + this.constant) / denominator;

    if (t < 0 || t > 1) {
      return null;
    }

    return target.copy(line.start).addScaledVector(direction, t);
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

  coplanarPoint(target: Vec3): Vec3 {
    return target.copy(this.normal).multiplyScalar(-this.constant);
  }

  applyMat4(matrix: Mat4, optionalNormalMatrix?: Mat3): Plane {
    const normalMatrix = optionalNormalMatrix || new Mat3().getNormalMatrix(matrix);

    const referencePoint = this.coplanarPoint(new Vec3()).applyMat4(matrix);

    const normal = this.normal.applyMat3(normalMatrix).normalize();

    this.constant = -referencePoint.dot(normal);

    return this;
  }

  translate(offset: Vec3): Plane {
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
