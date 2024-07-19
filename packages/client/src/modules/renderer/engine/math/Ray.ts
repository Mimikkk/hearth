import { Vec3 } from './Vec3.js';
import type { Sphere } from './Sphere.js';
import type { Plane } from './Plane.js';
import type { Box3 } from './Box3.js';
import type { Mat4 } from './Mat4.js';
import type { Const } from '@modules/renderer/engine/math/types.js';
import type { Triangle } from '@modules/renderer/engine/math/Triangle.js';
import type { Line3 } from './Line3.js';

export class Ray {
  declare isRay: true;

  constructor(
    public origin: Vec3 = Vec3.new(),
    public direction: Vec3 = Vec3.new(0, 0, -1),
  ) {}

  static new(origin: Vec3 = Vec3.new(), direction: Vec3 = Vec3.new(0, 0, -1)): Ray {
    return new Ray(origin, direction);
  }

  static empty(): Ray {
    return Ray.new();
  }

  static clone(ray: Const<Ray>, into: Ray = Ray.empty()): Ray {
    return into.from(ray);
  }

  static is(ray: any): ray is Ray {
    return ray?.isRay === true;
  }

  static from(ray: Const<Ray>, into: Ray = Ray.empty()): Ray {
    return into.from(ray);
  }

  static fromParams(
    originX: number,
    originY: number,
    originZ: number,
    directionX: number,
    directionY: number,
    directionZ: number,
    into: Ray = Ray.new(),
  ): Ray {
    return into.setParams(originX, originY, originZ, directionX, directionY, directionZ);
  }

  from(ray: Const<Ray>): this {
    return this.set(ray.origin, ray.direction);
  }

  set(origin: Const<Vec3>, direction: Const<Vec3>): this {
    this.origin.from(origin);
    this.direction.from(direction);
    return this;
  }

  setParams(
    originX: number,
    originY: number,
    originZ: number,
    directionX: number,
    directionY: number,
    directionZ: number,
  ): this {
    this.direction.set(directionX, directionY, directionZ);
    this.origin.set(originX, originY, originZ);
    return this;
  }

  clone(ray: Ray): this {
    this.origin.from(ray.origin);
    this.direction.from(ray.direction);

    return this;
  }

  at(t: number, into: Vec3 = Vec3.new()): Vec3 {
    return into.from(this.origin).addScaled(this.direction, t);
  }

  recast(t: number): this {
    this.origin.from(this.at(t));

    return this;
  }

  lookAt(vec: Const<Vec3>): this {
    this.direction.from(vec).sub(this.origin).normalize();

    return this;
  }

  closestAt(coord: Const<Vec3>, into: Vec3 = Vec3.new()): Vec3 {
    into.from(coord).sub(this.origin);

    const directionDistance = into.dot(this.direction);

    into.from(this.origin);
    if (directionDistance < 0) return into;
    return into.addScaled(this.direction, directionDistance);
  }

  distanceTo(coord: Const<Vec3>): number {
    return Math.sqrt(this.distanceSqTo(coord));
  }

  distanceSqTo(coord: Const<Vec3>): number {
    const vec1 = _vec1.from(coord).sub(this.origin);
    const direction = vec1.dot(this.direction);
    // point behind the ray
    if (direction < 0) return this.origin.distanceSqTo(coord);

    const vec2 = _vec2.from(this.origin).addScaled(this.direction, direction);
    return vec2.distanceSqTo(coord);
  }

  distanceToLine(line: Const<Line3>, intoRayCoord?: Vec3, intoSegmentCoord?: Vec3): number {
    return Math.sqrt(this.distanceSqToLine(line, intoRayCoord, intoSegmentCoord));
  }

  distanceSqToLine({ start, end }: Const<Line3>, intoRayCoord?: Vec3, intoSegmentCoord?: Vec3): number {
    const _segCenter = _v0.from(start).add(end).scale(0.5);
    const _segDir = _v1.from(end).sub(start).normalize();
    const _diff = _v2.from(this.origin).sub(_segCenter);

    const segExtent = start.distanceTo(end) * 0.5;
    const a01 = -this.direction.dot(_segDir);
    const b0 = _diff.dot(this.direction);
    const b1 = -_diff.dot(_segDir);
    const c = _diff.lengthSq();
    const det = Math.abs(1 - a01 * a01);

    let s0, s1, sqrDist, extDet;
    if (det > 0) {
      // The ray and segment are not parallel.

      s0 = a01 * b1 - b0;
      s1 = a01 * b0 - b1;
      extDet = segExtent * det;

      if (s0 >= 0) {
        if (s1 >= -extDet) {
          if (s1 <= extDet) {
            // region 0
            // Minimum at interior points of ray and segment.

            const invDet = 1 / det;
            s0 *= invDet;
            s1 *= invDet;
            sqrDist = s0 * (s0 + a01 * s1 + 2 * b0) + s1 * (a01 * s0 + s1 + 2 * b1) + c;
          } else {
            // region 1

            s1 = segExtent;
            s0 = Math.max(0, -(a01 * s1 + b0));
            sqrDist = -s0 * s0 + s1 * (s1 + 2 * b1) + c;
          }
        } else {
          // region 5

          s1 = -segExtent;
          s0 = Math.max(0, -(a01 * s1 + b0));
          sqrDist = -s0 * s0 + s1 * (s1 + 2 * b1) + c;
        }
      } else {
        if (s1 <= -extDet) {
          // region 4

          s0 = Math.max(0, -(-a01 * segExtent + b0));
          s1 = s0 > 0 ? -segExtent : Math.min(Math.max(-segExtent, -b1), segExtent);
          sqrDist = -s0 * s0 + s1 * (s1 + 2 * b1) + c;
        } else if (s1 <= extDet) {
          // region 3

          s0 = 0;
          s1 = Math.min(Math.max(-segExtent, -b1), segExtent);
          sqrDist = s1 * (s1 + 2 * b1) + c;
        } else {
          // region 2

          s0 = Math.max(0, -(a01 * segExtent + b0));
          s1 = s0 > 0 ? segExtent : Math.min(Math.max(-segExtent, -b1), segExtent);
          sqrDist = -s0 * s0 + s1 * (s1 + 2 * b1) + c;
        }
      }
    } else {
      // Ray and segment are parallel.

      s1 = a01 > 0 ? -segExtent : segExtent;
      s0 = Math.max(0, -(a01 * s1 + b0));
      sqrDist = -s0 * s0 + s1 * (s1 + 2 * b1) + c;
    }

    if (intoRayCoord) {
      intoRayCoord.from(this.origin).addScaled(this.direction, s0);
    }
    if (intoSegmentCoord) {
      intoSegmentCoord.from(_segCenter).addScaled(_segDir, s1);
    }

    return sqrDist;
  }

  intersectSphere(sphere: Const<Sphere>, into: Vec3 = Vec3.new()): Vec3 | null {
    const _vector = _v0.from(sphere.center).sub(this.origin);
    const tca = _vector.dot(this.direction);
    const d2 = _vector.dot(_vector) - tca * tca;
    const radius2 = sphere.radius * sphere.radius;

    if (d2 > radius2) return null;

    const thc = Math.sqrt(radius2 - d2);

    // t0 = first intersect point - entrance on front of sphere
    const t0 = tca - thc;

    // t1 = second intersect point - exit point on back of sphere
    const t1 = tca + thc;

    // test to see if t1 is behind the ray - if so, return null
    if (t1 < 0) return null;

    // test to see if t0 is behind the ray:
    // if it is, the ray is inside the sphere, so return the second exit point scaled by t1,
    // in order to always return an intersect point that is in front of the ray.
    if (t0 < 0) return this.at(t1, into);

    // else t0 is in front of the ray, so return the first collision point scaled by t0
    return this.at(t0, into);
  }

  intersectsSphere(sphere: Const<Sphere>): boolean {
    return this.distanceSqTo(sphere.center) <= sphere.radius * sphere.radius;
  }

  distanceToPlane(plane: Const<Plane>): number | null {
    const denominator = plane.normal.dot(this.direction);

    if (denominator === 0) {
      if (plane.distanceTo(this.origin) === 0) return 0;
      return null;
    }

    const distance = -(this.origin.dot(plane.normal) + plane.constant) / denominator;
    return distance >= 0 ? distance : null;
  }

  intersectPlane(plane: Const<Plane>, into: Vec3 = Vec3.new()): Vec3 | null {
    const t = this.distanceToPlane(plane);
    if (t === null) return null;

    return this.at(t, into);
  }

  intersectsPlane(plane: Const<Plane>) {
    const distance = plane.distanceTo(this.origin);
    if (distance === 0) return true;

    return plane.normal.dot(this.direction) * distance < 0;
  }

  intersectBox(box: Const<Box3>, into: Vec3 = Vec3.new()): Vec3 | null {
    let tmin: number;
    let tmax: number;
    let tymin: number;
    let tymax: number;
    let tzmin: number;
    let tzmax: number;

    const invDirX = 1 / this.direction.x;
    const invDirY = 1 / this.direction.y;
    const invDirZ = 1 / this.direction.z;

    const origin = this.origin;

    if (invDirX >= 0) {
      tmin = (box.min.x - origin.x) * invDirX;
      tmax = (box.max.x - origin.x) * invDirX;
    } else {
      tmin = (box.max.x - origin.x) * invDirX;
      tmax = (box.min.x - origin.x) * invDirX;
    }

    if (invDirY >= 0) {
      tymin = (box.min.y - origin.y) * invDirY;
      tymax = (box.max.y - origin.y) * invDirY;
    } else {
      tymin = (box.max.y - origin.y) * invDirY;
      tymax = (box.min.y - origin.y) * invDirY;
    }

    if (tmin > tymax || tymin > tmax) return null;

    if (tymin > tmin || isNaN(tmin)) tmin = tymin;

    if (tymax < tmax || isNaN(tmax)) tmax = tymax;

    if (invDirZ >= 0) {
      tzmin = (box.min.z - origin.z) * invDirZ;
      tzmax = (box.max.z - origin.z) * invDirZ;
    } else {
      tzmin = (box.max.z - origin.z) * invDirZ;
      tzmax = (box.min.z - origin.z) * invDirZ;
    }

    if (tmin > tzmax || tzmin > tmax) return null;

    if (tzmin > tmin || tmin !== tmin) tmin = tzmin;

    if (tzmax < tmax || tmax !== tmax) tmax = tzmax;

    //return point closest to the ray (positive side)

    if (tmax < 0) return null;

    return this.at(tmin >= 0 ? tmin : tmax, into);
  }

  intersectsBox(box: Const<Box3>): boolean {
    return this.intersectBox(box, _vec0) !== null;
  }

  intersectTriangle({ a, b, c }: Const<Triangle>, cullBackface: boolean, into: Vec3 = Vec3.new()): Vec3 | null {
    const _edge1 = _v0.from(b).sub(a);
    const _edge2 = _v1.from(c).sub(a);
    const _normal = _v2.from(_edge1).cross(_edge2);

    // Solve Q + t*D = b1*E1 + b2*E2 (Q = kDiff, D = ray direction,
    // E1 = kEdge1, E2 = kEdge2, N = Cross(E1,E2)) by
    //   |Dot(D,N)|*b1 = sign(Dot(D,N))*Dot(D,Cross(Q,E2))
    //   |Dot(D,N)|*b2 = sign(Dot(D,N))*Dot(D,Cross(E1,Q))
    //   |Dot(D,N)|*t = -sign(Dot(D,N))*Dot(Q,N)
    let DdN = this.direction.dot(_normal);
    let sign;

    if (DdN > 0) {
      if (cullBackface) return null;
      sign = 1;
    } else if (DdN < 0) {
      sign = -1;
      DdN = -DdN;
    } else {
      return null;
    }

    const _diff = _v3.from(this.origin).sub(a);
    const _x = _v4.from(_diff).cross(_edge2);
    const DdQxE2 = sign * this.direction.dot(_x);

    // b1 < 0, no intersection
    if (DdQxE2 < 0) return null;

    const DdE1xQ = sign * this.direction.dot(_edge1.cross(_diff));

    // b2 < 0, no intersection
    if (DdE1xQ < 0) return null;

    // b1+b2 > 1, no intersection
    if (DdQxE2 + DdE1xQ > DdN) return null;

    // Line intersects triangle, check if ray does.
    const QdN = -sign * _diff.dot(_normal);

    // t < 0, no intersection
    if (QdN < 0) return null;

    // Ray intersects triangle.
    return this.at(QdN / DdN, into);
  }

  applyMat4(matrix4: Const<Mat4>): this {
    this.origin.applyMat4(matrix4);
    this.direction.transformDirection(matrix4);

    return this;
  }

  equals(ray: Const<Ray>): boolean {
    return ray.origin.equals(this.origin) && ray.direction.equals(this.direction);
  }
}

Ray.prototype.isRay = true;

const _vec0 = Vec3.new();
const _vec1 = Vec3.new();
const _vec2 = Vec3.new();
const _v0 = Vec3.new();
const _v1 = Vec3.new();
const _v2 = Vec3.new();
const _v3 = Vec3.new();
const _v4 = Vec3.new();
