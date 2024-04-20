import { Box3 } from './Box3.js';
import { Vector3 } from './Vector3.js';
import type { Plane } from './Plane.js';
import type { Matrix4 } from './Matrix4.js';

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
    if (sphere.isEmpty()) {
      return this;
    }

    if (this.isEmpty()) {
      this.copy(sphere);

      return this;
    }

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
