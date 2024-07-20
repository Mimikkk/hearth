import { Box3 } from './Box3.js';
import { Vec3 } from './Vec3.js';
import type { Plane } from './Plane.js';
import type { Mat4 } from './Mat4.js';
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

  clone(into: Sphere = Sphere.empty()): Sphere {
    return Sphere.clone(this, into);
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
    return Math.abs(plane.distanceTo(this.center)) <= this.radius;
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

  applyMat4(matrix: Const<Mat4>): this {
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
