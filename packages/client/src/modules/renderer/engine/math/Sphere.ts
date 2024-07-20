import { Box3 } from './Box3.js';
import { Vec3 } from './Vec3.js';
import type { Plane } from './Plane.js';
import type { Mat4 } from './Mat4.js';
import { Const } from '@modules/renderer/engine/math/types.js';

export class Sphere {
  declare isSphere: true;
  declare ['constructor']: typeof Sphere;

  constructor(
    public center: Vec3 = new Vec3(),
    public radius: number = -1,
  ) {}

  static new(center: Const<Vec3> = Vec3.new(), radius: number = -1): Sphere {
    return new Sphere(center, radius);
  }

  set(center: Vec3, radius: number): this {
    this.center.from(center);
    this.radius = radius;

    return this;
  }

  setFromPoints(points: Vec3[], optionalCenter?: Vec3): Sphere {
    const center = this.center;

    if (optionalCenter !== undefined) {
      center.from(optionalCenter);
    } else {
      new Box3().fromCoords(points).center(center);
    }

    let maxRadiusSq = 0;

    for (let i = 0, il = points.length; i < il; i++) {
      maxRadiusSq = Math.max(maxRadiusSq, center.distanceSqTo(points[i]));
    }

    this.radius = Math.sqrt(maxRadiusSq);

    return this;
  }

  copy(sphere: Sphere): this {
    this.center.from(sphere.center);
    this.radius = sphere.radius;

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

  containsPoint(point: Vec3): boolean {
    return point.distanceSqTo(this.center) <= this.radius * this.radius;
  }

  distanceToPoint(point: Vec3): number {
    return point.distanceTo(this.center) - this.radius;
  }

  intersectsSphere(sphere: Sphere): boolean {
    const radiusSum = this.radius + sphere.radius;

    return sphere.center.distanceSqTo(this.center) <= radiusSum * radiusSum;
  }

  intersectsBox(box: Box3): boolean {
    return box.intersectsSphere(this);
  }

  intersectsPlane(plane: Plane): boolean {
    return Math.abs(plane.distanceTo(this.center)) <= this.radius;
  }

  clampPoint(point: Vec3, target: Vec3): Vec3 {
    const deltaLengthSq = this.center.distanceSqTo(point);

    target.from(point);

    if (deltaLengthSq > this.radius * this.radius) {
      target.sub(this.center).normalize();
      target.scale(this.radius).add(this.center);
    }

    return target;
  }

  getBoundingBox(target: Box3): Box3 {
    if (this.isEmpty()) {
      // Empty sphere produces empty bounding box
      target.clear();
      return target;
    }

    target.set(this.center, this.center);
    target.expandScalar(this.radius);

    return target;
  }

  applyMat4(matrix: Mat4): this {
    this.center.applyMat4(matrix);
    this.radius = this.radius * matrix.getMaxScaleOnAxis();

    return this;
  }

  translate(offset: Vec3): this {
    this.center.add(offset);

    return this;
  }

  expandByPoint(point: Vec3): this {
    if (this.isEmpty()) {
      this.center.from(point);

      this.radius = 0;

      return this;
    }

    const _v1 = new Vec3().subVectors(point, this.center);

    const lengthSq = _v1.lengthSq();

    if (lengthSq > this.radius * this.radius) {
      // calculate the minimal sphere

      const length = Math.sqrt(lengthSq);

      const delta = (length - this.radius) * 0.5;

      this.center.addScaled(_v1, delta / length);

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
      const _v2 = new Vec3().subVectors(sphere.center, this.center).setLength(sphere.radius);

      this.expandByPoint(new Vec3().from(sphere.center).add(_v2));

      this.expandByPoint(new Vec3().from(sphere.center).sub(_v2));
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
