import { Vec3 } from './Vector3.js';
import type { Sphere_ } from './Sphere.js';
import { Plane_ } from './Plane.js';
import type { Box3 } from './Box3.js';
import type { Matrix4 } from './Matrix4.js';
import { temp } from '@modules/renderer/engine/math/types.js';

export class Ray {
  declare ['constructor']: typeof Ray;

  constructor(
    public origin: Vec3 = Vec3.new(),
    public direction: Vec3 = Vec3.new(0, 0, -1),
  ) {}

  set(origin: Vec3, direction: Vec3): this {
    this.origin.from(origin);
    this.direction.from(direction);
    return this;
  }

  copy(ray: Ray): this {
    this.origin.from(ray.origin);
    this.direction.from(ray.direction);

    return this;
  }

  at(t: number, into: Vec3 = Vec3.new()): Vec3 {
    return into.from(this.origin).addScaled(this.direction, t);
  }

  lookAt(v: Vec3): this {
    this.direction.from(v).sub(this.origin).normalize();

    return this;
  }

  recast(t: number): this {
    this.origin.from(this.at(t));

    return this;
  }

  closestAt(point: Vec3, into: Vec3): Vec3 {
    into.from(point).sub(this.origin);

    const directionDistance = into.dot(this.direction);

    into.from(this.origin);
    if (directionDistance < 0) return into;
    return into.addScaled(this.direction, directionDistance);
  }

  distanceTo(point: Vec3): number {
    return Math.sqrt(this.distanceSqTo(point));
  }

  distanceSqTo(point: Vec3): number {
    const vec1 = _vec1(point).sub(this.origin);
    const direction = vec1.dot(this.direction);

    // point behind the ray
    if (direction < 0) return this.origin.distanceSqTo(point);

    const vec2 = _vec2(this.origin).addScaled(this.direction, direction);
    return vec2.distanceSqTo(point);
  }

  distanceToSegment(v0: Vec3, v1: Vec3, rayPoint?: Vec3, segmentPoint?: Vec3): number {
    return Math.sqrt(this.distanceSqToSegment(v0, v1, rayPoint, segmentPoint));
  }

  distanceSqToSegment(v0: Vec3, v1: Vec3, rayPoint?: Vec3, segmentPoint?: Vec3): number {
    const _segCenter = _v0(v0).add(v1).scale(0.5);
    const _segDir = _v1(v1).sub(v0).normalize();
    const _diff = _v2(this.origin).sub(_segCenter);

    const segExtent = v0.distanceTo(v1) * 0.5;
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

    if (rayPoint) {
      rayPoint.from(this.origin).addScaled(this.direction, s0);
    }
    if (segmentPoint) {
      segmentPoint.from(_segCenter).addScaled(_segDir, s1);
    }

    return sqrDist;
  }

  intersectSphere(sphere: Sphere_, target: Vec3): Vec3 | null {
    const _vector = _v0(sphere.center).sub(this.origin);
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
    if (t0 < 0) return this.at(t1, target);

    // else t0 is in front of the ray, so return the first collision point scaled by t0
    return this.at(t0, target);
  }

  intersectsSphere(sphere: Sphere_): boolean {
    return this.distanceSqTo(sphere.center) <= sphere.radius * sphere.radius;
  }

  distanceToPlane(plane: Plane_): number | null {
    const denominator = plane.normal.dot(this.direction);

    if (denominator === 0) {
      // line is coplanar, return origin
      if (Plane_.distanceToVec(plane, this.origin) === 0) {
        return 0;
      }

      // Null is preferable to undefined since undefined means.... it is undefined

      return null;
    }

    const t = -(this.origin.dot(plane.normal) + plane.constant) / denominator;

    // Return if the ray never intersects the plane

    return t >= 0 ? t : null;
  }

  intersectPlane(plane: Plane_, target: Vec3): Vec3 | null {
    const t = this.distanceToPlane(plane);

    if (t === null) {
      return null;
    }

    return this.at(t, target);
  }

  intersectsPlane(plane: Plane_) {
    // check if the ray lies on the plane first
    const distance = Plane_.distanceToVec(plane, this.origin);

    if (distance === 0) return true;

    const denominator = plane.normal.dot(this.direction);

    if (denominator * distance < 0) return true;

    // ray origin is behind the plane (and is pointing behind it)
    return false;
  }

  intersectBox(box: Box3, target: Vec3): Vec3 | null {
    let tmin, tmax, tymin, tymax, tzmin, tzmax;

    const invdirx = 1 / this.direction.x,
      invdiry = 1 / this.direction.y,
      invdirz = 1 / this.direction.z;

    const origin = this.origin;

    if (invdirx >= 0) {
      tmin = (box.min.x - origin.x) * invdirx;
      tmax = (box.max.x - origin.x) * invdirx;
    } else {
      tmin = (box.max.x - origin.x) * invdirx;
      tmax = (box.min.x - origin.x) * invdirx;
    }

    if (invdiry >= 0) {
      tymin = (box.min.y - origin.y) * invdiry;
      tymax = (box.max.y - origin.y) * invdiry;
    } else {
      tymin = (box.max.y - origin.y) * invdiry;
      tymax = (box.min.y - origin.y) * invdiry;
    }

    if (tmin > tymax || tymin > tmax) return null;

    if (tymin > tmin || isNaN(tmin)) tmin = tymin;

    if (tymax < tmax || isNaN(tmax)) tmax = tymax;

    if (invdirz >= 0) {
      tzmin = (box.min.z - origin.z) * invdirz;
      tzmax = (box.max.z - origin.z) * invdirz;
    } else {
      tzmin = (box.max.z - origin.z) * invdirz;
      tzmax = (box.min.z - origin.z) * invdirz;
    }

    if (tmin > tzmax || tzmin > tmax) return null;

    if (tzmin > tmin || tmin !== tmin) tmin = tzmin;

    if (tzmax < tmax || tmax !== tmax) tmax = tzmax;

    //return point closest to the ray (positive side)

    if (tmax < 0) return null;

    return this.at(tmin >= 0 ? tmin : tmax, target);
  }

  intersectsBox(box: Box3): boolean {
    return this.intersectBox(box, Vec3.new(0, 0, 0)) !== null;
  }

  intersectTriangle(a: Vec3, b: Vec3, c: Vec3, backfaceCulling: boolean, target: Vec3): Vec3 | null {
    const _edge1 = _v0(b).sub(a);
    const _edge2 = _v1(c).sub(a);
    const _normal = _v2(_edge1).cross(_edge2);

    // Solve Q + t*D = b1*E1 + b2*E2 (Q = kDiff, D = ray direction,
    // E1 = kEdge1, E2 = kEdge2, N = Cross(E1,E2)) by
    //   |Dot(D,N)|*b1 = sign(Dot(D,N))*Dot(D,Cross(Q,E2))
    //   |Dot(D,N)|*b2 = sign(Dot(D,N))*Dot(D,Cross(E1,Q))
    //   |Dot(D,N)|*t = -sign(Dot(D,N))*Dot(Q,N)
    let DdN = this.direction.dot(_normal);
    let sign;

    if (DdN > 0) {
      if (backfaceCulling) return null;
      sign = 1;
    } else if (DdN < 0) {
      sign = -1;
      DdN = -DdN;
    } else {
      return null;
    }

    const _diff = _v3(this.origin).sub(a);
    const _x = _v4(_diff).cross(_edge2);
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
    return this.at(QdN / DdN, target);
  }

  applyMat4(matrix4: Matrix4): this {
    this.origin.applyMat4(matrix4);
    this.direction.transformDirection(matrix4);

    return this;
  }

  equals(ray: Ray): boolean {
    return ray.origin.equals(this.origin) && ray.direction.equals(this.direction);
  }

  clone(): Ray {
    return new this.constructor().copy(this);
  }
}

const _vec1 = temp(Vec3.new);
const _vec2 = temp(Vec3.new);
const _v0 = temp(Vec3.new);
const _v1 = temp(Vec3.new);
const _v2 = temp(Vec3.new);
const _v3 = temp(Vec3.new);
const _v4 = temp(Vec3.new);
