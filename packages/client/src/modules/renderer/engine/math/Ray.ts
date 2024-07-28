import { Vec3 } from './Vec3.js';
import type { Sphere } from './Sphere.js';
import type { Plane } from './Plane.js';
import type { Box3 } from './Box3.js';
import type { Mat4 } from './Mat4.js';
import type { Const } from '@modules/renderer/engine/math/types.js';
import type { Line3 } from '@modules/renderer/engine/math/Line3.js';
import type { Triangle } from '@modules/renderer/engine/math/Triangle.js';

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

  static clone(ray: Const<Ray>, into: Ray = Ray.new()): Ray {
    return into.from(ray);
  }

  static is(ray: any): ray is Ray {
    return ray?.isRay === true;
  }

  static from(ray: Const<Ray>, into: Ray = Ray.new()): Ray {
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

  from({ origin, direction }: Const<Ray>): this {
    return this.set(origin, direction);
  }

  at(step: number, into: Vec3 = Vec3.new()): Vec3 {
    return into.from(this.origin).addScaled(this.direction, step);
  }

  lookAt(at: Const<Vec3>): this {
    this.direction.from(at).sub(this.origin).normalize();

    return this;
  }

  recast(step: number): this {
    this.origin.from(this.at(step, _distance1));

    return this;
  }

  closestTo(coord: Const<Vec3>, into: Vec3 = Vec3.new()): Vec3 {
    const distance = into.asSub(coord, this.origin).dot(this.direction);
    into.from(this.origin);

    return distance < 0 ? into : into.addScaled(this.direction, distance);
  }

  distanceTo(coord: Const<Vec3>): number {
    return Math.sqrt(this.distanceSqTo(coord));
  }

  distanceSqTo(coord: Const<Vec3>): number {
    const directionDistance = _distance1.asSub(coord, this.origin).dot(this.direction);



    if (directionDistance < 0) {
      return this.origin.distanceSqTo(coord);
    }

    return _distance2.from(this.origin).addScaled(this.direction, directionDistance).distanceSqTo(coord);
  }

  distanceToLine(line: Const<Line3>): number {
    return Math.sqrt(this.distanceSqToLine(line));
  }

  distanceSqToLine({ start, end }: Const<Line3>, intoRayCoord?: Vec3, intoLineCoord?: Vec3): number {
    const _segCenter = _vec0.from(start).add(end).scale(0.5);
    const _direction = _vec1.from(end).sub(start).normalize();
    const _diff = _vec2.from(this.origin).sub(_segCenter);

    const segExtent = start.distanceTo(end) * 0.5;
    const a01 = -this.direction.dot(_direction);
    const b0 = _diff.dot(this.direction);
    const b1 = -_diff.dot(_direction);
    const c = _diff.lengthSq();
    const det = Math.abs(1 - a01 * a01);
    let s0, s1, sqrDist, extDet;

    if (det > 0) {


      s0 = a01 * b1 - b0;
      s1 = a01 * b0 - b1;
      extDet = segExtent * det;

      if (s0 >= 0) {
        if (s1 >= -extDet) {
          if (s1 <= extDet) {



            const invDet = 1 / det;
            s0 *= invDet;
            s1 *= invDet;
            sqrDist = s0 * (s0 + a01 * s1 + 2 * b0) + s1 * (a01 * s0 + s1 + 2 * b1) + c;
          } else {


            s1 = segExtent;
            s0 = Math.max(0, -(a01 * s1 + b0));
            sqrDist = -s0 * s0 + s1 * (s1 + 2 * b1) + c;
          }
        } else {


          s1 = -segExtent;
          s0 = Math.max(0, -(a01 * s1 + b0));
          sqrDist = -s0 * s0 + s1 * (s1 + 2 * b1) + c;
        }
      } else {
        if (s1 <= -extDet) {


          s0 = Math.max(0, -(-a01 * segExtent + b0));
          s1 = s0 > 0 ? -segExtent : Math.min(Math.max(-segExtent, -b1), segExtent);
          sqrDist = -s0 * s0 + s1 * (s1 + 2 * b1) + c;
        } else if (s1 <= extDet) {


          s0 = 0;
          s1 = Math.min(Math.max(-segExtent, -b1), segExtent);
          sqrDist = s1 * (s1 + 2 * b1) + c;
        } else {


          s0 = Math.max(0, -(a01 * segExtent + b0));
          s1 = s0 > 0 ? segExtent : Math.min(Math.max(-segExtent, -b1), segExtent);
          sqrDist = -s0 * s0 + s1 * (s1 + 2 * b1) + c;
        }
      }
    } else {


      s1 = a01 > 0 ? -segExtent : segExtent;
      s0 = Math.max(0, -(a01 * s1 + b0));
      sqrDist = -s0 * s0 + s1 * (s1 + 2 * b1) + c;
    }

    if (intoRayCoord) {
      intoRayCoord.from(this.origin).addScaled(this.direction, s0);
    }

    if (intoLineCoord) {
      intoLineCoord.from(_segCenter).addScaled(_direction, s1);
    }

    return sqrDist;
  }

  distanceToPlane(plane: Const<Plane>): number | null {
    const denominator = plane.normal.dot(this.direction);

    if (denominator === 0) {

      if (plane.distanceTo(this.origin) === 0) {
        return 0;
      }



      return null;
    }

    const t = -(this.origin.dot(plane.normal) + plane.constant) / denominator;



    return t >= 0 ? t : null;
  }

  intersectsSphere(sphere: Const<Sphere>): boolean {
    return this.distanceSqTo(sphere.center) <= sphere.radius * sphere.radius;
  }

  intersectsPlane(plane: Const<Plane>) {


    const distToPoint = plane.distanceTo(this.origin);

    if (distToPoint === 0) {
      return true;
    }

    const denominator = plane.normal.dot(this.direction);

    if (denominator * distToPoint < 0) {
      return true;
    }



    return false;
  }

  intersectsBox(box: Const<Box3>): boolean {
    return this.intersectBox(box, _intersect) !== null;
  }

  intersectSphere(sphere: Const<Sphere>, into: Vec3 = Vec3.new()): Vec3 | null {
    const _vector = _sphere.asSub(sphere.center, this.origin);
    const tca = _vector.dot(this.direction);
    const d2 = _vector.dot(_vector) - tca * tca;
    const radius2 = sphere.radius * sphere.radius;
    if (d2 > radius2) return null;

    const thc = Math.sqrt(radius2 - d2);

    const t0 = tca - thc;
    const t1 = tca + thc;
    if (t1 < 0) return null;
    if (t0 < 0) return this.at(t1, into);
    return this.at(t0, into);
  }

  intersectPlane(plane: Const<Plane>, into: Vec3 = Vec3.new()): Vec3 | null {
    const t = this.distanceToPlane(plane);
    if (t === null) return null;
    return this.at(t, into);
  }

  intersectBox(box: Const<Box3>, into: Vec3 = Vec3.new()): Vec3 | null {
    let tmin, tmax, tymin, tymax, tzmin, tzmax;

    const invdirx = 1 / this.direction.x;
    const invdiry = 1 / this.direction.y;
    const invdirz = 1 / this.direction.z;

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

    if (tmax < 0) return null;

    return this.at(tmin >= 0 ? tmin : tmax, into);
  }

  intersectTriangle(
    { a, b, c }: Const<Triangle>,
    backfaceCulling: boolean,
    into: Const<Vec3> = Vec3.new(),
  ): Vec3 | null {




    const _edge1 = _triangle0.asSub(b, a);
    const _edge2 = _triangle1.asSub(c, a);
    const _normal = _triangle2.asCross(_edge1, _edge2);






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

    const _diff = _triangle3.asSub(this.origin, a);
    const DdQxE2 = sign * this.direction.dot(_edge2.asCross(_diff, _edge2));


    if (DdQxE2 < 0) {
      return null;
    }

    const DdE1xQ = sign * this.direction.dot(_edge1.cross(_diff));


    if (DdE1xQ < 0) {
      return null;
    }


    if (DdQxE2 + DdE1xQ > DdN) {
      return null;
    }


    const QdN = -sign * _diff.dot(_normal);


    if (QdN < 0) {
      return null;
    }


    return this.at(QdN / DdN, into);
  }

  applyMat4(Mat4: Const<Mat4>): this {
    this.origin.applyMat4(Mat4);
    this.direction.transformDirection(Mat4);

    return this;
  }

  equals(ray: Const<Ray>): boolean {
    return ray.origin.equals(this.origin) && ray.direction.equals(this.direction);
  }

  clone(into: Ray = Ray.new()): Ray {
    return into.from(this);
  }
}

Ray.prototype.isRay = true;

const _sphere = Vec3.new();
const _distance1 = Vec3.new();
const _distance2 = Vec3.new();
const _intersect = Vec3.new();
const _vec0 = Vec3.new();
const _vec1 = Vec3.new();
const _vec2 = Vec3.new();
const _triangle0 = Vec3.new();
const _triangle1 = Vec3.new();
const _triangle2 = Vec3.new();
const _triangle3 = Vec3.new();
