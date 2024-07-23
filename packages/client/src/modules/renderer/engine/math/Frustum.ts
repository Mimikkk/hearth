import { Vec3 } from './Vec3.js';
import { Sphere } from './Sphere.js';
import { Plane } from './Plane.js';
import type { Mat4 } from './Mat4.js';
import type { Box3 } from './Box3.js';
import type { Sprite } from '../objects/Sprite.js';
import type { Object3D } from '../core/Object3D.js';
import { Const } from '@modules/renderer/engine/math/types.js';

export class Frustum {
  declare isFrustum: true;

  constructor(
    public planes: Plane[] = [Plane.new(), Plane.new(), Plane.new(), Plane.new(), Plane.new(), Plane.new()],
  ) {}

  static new(
    planes: Plane[] = [Plane.new(), Plane.new(), Plane.new(), Plane.new(), Plane.new(), Plane.new()],
  ): Frustum {
    return new Frustum(planes);
  }

  static empty(): Frustum {
    return Frustum.new();
  }

  static clone(frustum: Const<Frustum>, into: Frustum = Frustum.empty()): Frustum {
    return into.from(frustum);
  }

  static is(frustum: any): frustum is Frustum {
    return frustum?.isFrustum === true;
  }

  static into(into: Frustum, frustum: Const<Frustum>): Frustum {
    return into.from(frustum);
  }

  static from(frustum: Const<Frustum>, into: Frustum = Frustum.new()): Frustum {
    return into.from(frustum);
  }

  static fromParams(
    p1: Const<Plane>,
    p2: Const<Plane>,
    p3: Const<Plane>,
    p4: Const<Plane>,
    p5: Const<Plane>,
    p6: Const<Plane>,
    into: Frustum = Frustum.new(),
  ): Frustum {
    return into.set(p1, p2, p3, p4, p5, p6);
  }

  static fromPlanes(planes: Const<Plane>[], into: Frustum = Frustum.new()): Frustum {
    return into.fromPlanes(planes);
  }

  static fromProjection(mat: Const<Mat4>, into: Frustum = Frustum.new()): Frustum {
    return into.fromProjection(mat);
  }

  clone(into = Frustum.new()): Frustum {
    return into.from(this);
  }

  set(
    p1: Const<Plane>,
    p2: Const<Plane>,
    p3: Const<Plane>,
    p4: Const<Plane>,
    p5: Const<Plane>,
    p6: Const<Plane>,
  ): this {
    this.planes[0].from(p1);
    this.planes[1].from(p2);
    this.planes[2].from(p3);
    this.planes[3].from(p4);
    this.planes[4].from(p5);
    this.planes[5].from(p6);
    return this;
  }

  from({ planes }: Const<Frustum>): this {
    return this.fromPlanes(planes);
  }

  fromPlanes([p1, p2, p3, p4, p5, p6]: Const<Plane[]>): this {
    return this.set(p1, p2, p3, p4, p5, p6);
  }

  fromProjection({
    elements: [e00, e01, e02, e03, e04, e05, e06, e07, e08, e09, e10, e11, e12, e13, e14, e15],
  }: Const<Mat4>): this {
    const { planes } = this;

    planes[0].setParams(e03 - e00, e07 - e04, e11 - e08, e15 - e12).normalize();
    planes[1].setParams(e03 + e00, e07 + e04, e11 + e08, e15 + e12).normalize();
    planes[2].setParams(e03 + e01, e07 + e05, e11 + e09, e15 + e13).normalize();
    planes[3].setParams(e03 - e01, e07 - e05, e11 - e09, e15 - e13).normalize();
    planes[4].setParams(e03 - e02, e07 - e06, e11 - e10, e15 - e14).normalize();
    planes[5].setParams(e02, e06, e10, e14).normalize();

    return this;
  }

  intersectsObject(object: Const<Object3D>): boolean {
    if (object.boundingSphere !== undefined) {
      if (object.boundingSphere === null) object.computeBoundingSphere!();

      _sphere.from(object.boundingSphere!);
    } else {
      const geometry = object.geometry;
      if (geometry?.boundingSphere === null) geometry.computeBoundingSphere();

      _sphere.from(geometry!.boundingSphere!);
    }

    return this.intersectsSphere(_sphere.applyMat4(object.matrixWorld));
  }

  intersectsSprite(sprite: Const<Sprite>): boolean {
    _sphere.setParams(0, 0, 0, Math.SQRT1_2).applyMat4(sprite.matrixWorld);

    return this.intersectsSphere(_sphere);
  }

  intersectsSphere(sphere: Const<Sphere>): boolean {
    const [p1, p2, p3, p4, p5, p6] = this.planes;
    const center = sphere.center;
    const negRadius = -sphere.radius;

    if (p1.distanceTo(center) < negRadius) return false;
    if (p2.distanceTo(center) < negRadius) return false;
    if (p3.distanceTo(center) < negRadius) return false;
    if (p4.distanceTo(center) < negRadius) return false;
    if (p5.distanceTo(center) < negRadius) return false;
    if (p6.distanceTo(center) < negRadius) return false;

    return true;
  }

  intersectsBox(box: Const<Box3>): boolean {
    const [p1, p2, p3, p4, p5, p6] = this.planes;

    if (p1.distanceTo(vecFromPlane(p1, box)) < 0) return false;
    if (p2.distanceTo(vecFromPlane(p2, box)) < 0) return false;
    if (p3.distanceTo(vecFromPlane(p3, box)) < 0) return false;
    if (p4.distanceTo(vecFromPlane(p4, box)) < 0) return false;
    if (p5.distanceTo(vecFromPlane(p5, box)) < 0) return false;
    if (p6.distanceTo(vecFromPlane(p6, box)) < 0) return false;

    return true;
  }

  contains(point: Const<Vec3>): boolean {
    const [p1, p2, p3, p4, p5, p6] = this.planes;

    if (p1.distanceTo(point) < 0) return false;
    if (p2.distanceTo(point) < 0) return false;
    if (p3.distanceTo(point) < 0) return false;
    if (p4.distanceTo(point) < 0) return false;
    if (p5.distanceTo(point) < 0) return false;
    if (p6.distanceTo(point) < 0) return false;

    return true;
  }
}

Frustum.prototype.isFrustum = true;

const vecFromPlane = (plane: Const<Plane>, box: Const<Box3>): Vec3 =>
  _vec.set(
    plane.normal.x > 0 ? box.max.x : box.min.x,
    plane.normal.y > 0 ? box.max.y : box.min.y,
    plane.normal.z > 0 ? box.max.z : box.min.z,
  );

const _sphere = Sphere.new();
const _vec = Vec3.new();
