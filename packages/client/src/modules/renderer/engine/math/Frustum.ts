import { IVec3 } from './Vector3.js';
import { Sphere_ } from './Sphere.js';
import { Plane_ } from './Plane.js';
import type { Matrix4 } from './Matrix4.js';
import type { Box3_ } from './Box3.js';
import type { Sprite } from '../objects/Sprite.js';
import type { Object3D } from '../core/Object3D.js';
import { Const } from '@modules/renderer/engine/math/types.js';

export interface Frustum {
  planes: [right: Plane_, left: Plane_, bottom: Plane_, top: Plane_, far: Plane_, near: Plane_];
}

export namespace Frustum {
  export const create = (p0: Plane_, p1: Plane_, p2: Plane_, p3: Plane_, p4: Plane_, p5: Plane_): Frustum => ({
    planes: [p0, p1, p2, p3, p4, p5],
  });

  export const empty = (): Frustum =>
    create(Plane_.empty(), Plane_.empty(), Plane_.empty(), Plane_.empty(), Plane_.empty(), Plane_.empty());
  export const set = (
    self: Frustum,
    p0: Plane_,
    p1: Plane_,
    p2: Plane_,
    p3: Plane_,
    p4: Plane_,
    p5: Plane_,
  ): Frustum => {
    Plane_.fill_(self.planes[0], p0);
    Plane_.fill_(self.planes[1], p1);
    Plane_.fill_(self.planes[2], p2);
    Plane_.fill_(self.planes[3], p3);
    Plane_.fill_(self.planes[4], p4);
    Plane_.fill_(self.planes[5], p5);
    return self;
  };
  export const fill_ = (self: Frustum, { planes: [p0, p1, p2, p3, p4, p5] }: Const<Frustum>): Frustum =>
    set(self, p0, p1, p2, p3, p4, p5);

  export const fromProjection = (matrix: Const<Matrix4>): Frustum => fromProjection_(matrix, empty());

  export const fromProjection_ = (matrix: Const<Matrix4>, into: Frustum): Frustum => {
    const planes = into.planes;
    const [e0, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11, e12, e13, e14, e15] = matrix.elements;

    Plane_.set(planes[0], e3 - e0, e7 - e4, e11 - e8, e15 - e12);
    Plane_.normalize(planes[0]);

    Plane_.set(planes[1], e3 + e0, e7 + e4, e11 + e8, e15 + e12);
    Plane_.normalize(planes[1]);

    Plane_.set(planes[2], e3 + e1, e7 + e5, e11 + e9, e15 + e13);
    Plane_.normalize(planes[2]);

    Plane_.set(planes[3], e3 - e1, e7 - e5, e11 - e9, e15 - e13);
    Plane_.normalize(planes[3]);

    Plane_.set(planes[4], e3 - e2, e7 - e6, e11 - e10, e15 - e14);
    Plane_.normalize(planes[4]);

    Plane_.set(planes[5], e2, e6, e10, e14);
    Plane_.normalize(planes[5]);

    return into;
  };
  export const fillProjection = (self: Frustum, matrix: Const<Matrix4>): Frustum => fromProjection_(matrix, self);

  export const copy = (from: Frustum): Frustum => copy_(from, empty());
  export const copy_ = (from: Frustum, into: Frustum): Frustum => {
    into.planes = from.planes;
    return into;
  };

  export const clone = (from: Const<Frustum>): Frustum => clone_(from, empty());
  export const clone_ = (from: Const<Frustum>, into: Frustum): Frustum => fill_(into, from);

  export const intersectsObject = (self: Const<Frustum>, object: Object3D): boolean => {
    if (object.boundingSphere !== undefined) {
      if (object.boundingSphere === null) object.computeBoundingSphere();

      Sphere_.clone_(object.boundingSphere, _sphere);
      Sphere_.applyMat4(_sphere, object.matrixWorld);
    } else {
      const geometry = object.geometry!;
      if (geometry.boundingSphere === null) geometry.computeBoundingSphere();

      Sphere_.clone_(geometry.boundingSphere!, _sphere);
      Sphere_.applyMat4(_sphere, object.matrixWorld);
    }

    return intersectsSphere(self, _sphere);
  };
  const _sphere = Sphere_.empty();
  const cosPi4 = 0.7071067811865476;
  export const intersectsSprite = (self: Const<Frustum>, sprite: Sprite): boolean => {
    Sphere_.set(_sphere, 0, 0, 0, cosPi4);
    Sphere_.applyMat4(_sphere, sprite.matrixWorld);

    return intersectsSphere(self, _sphere);
  };
  export const intersectsSphere = ({ planes }: Const<Frustum>, { center, radius }: Sphere_): boolean => {
    radius = -radius;

    if (Plane_.distanceToVec(planes[0], center) < radius) return false;
    if (Plane_.distanceToVec(planes[1], center) < radius) return false;
    if (Plane_.distanceToVec(planes[2], center) < radius) return false;
    if (Plane_.distanceToVec(planes[3], center) < radius) return false;
    if (Plane_.distanceToVec(planes[4], center) < radius) return false;
    if (Plane_.distanceToVec(planes[5], center) < radius) return false;
    return true;
  };

  const _vec3 = IVec3.empty();

  const setVec = (plane: Const<Plane_>, box: Const<Box3_>): IVec3 =>
    IVec3.set(
      _vec3,
      plane.normal.x > 0 ? box.min.x : box.max.x,
      plane.normal.y > 0 ? box.min.y : box.max.y,
      plane.normal.z > 0 ? box.min.z : box.max.z,
    );
  export const intersectsBox = ({ planes }: Const<Frustum>, box: Box3_): boolean => {
    if (Plane_.distanceToVec(planes[0], setVec(planes[0], box)) < 0) return false;
    if (Plane_.distanceToVec(planes[1], setVec(planes[1], box)) < 0) return false;
    if (Plane_.distanceToVec(planes[2], setVec(planes[2], box)) < 0) return false;
    if (Plane_.distanceToVec(planes[3], setVec(planes[3], box)) < 0) return false;
    if (Plane_.distanceToVec(planes[4], setVec(planes[4], box)) < 0) return false;
    if (Plane_.distanceToVec(planes[5], setVec(planes[5], box)) < 0) return false;

    return true;
  };
  export const containsVec = ({ planes }: Const<Frustum>, point: Const<IVec3>): boolean => {
    if (Plane_.distanceToVec(planes[0], point) < 0) return false;
    if (Plane_.distanceToVec(planes[1], point) < 0) return false;
    if (Plane_.distanceToVec(planes[2], point) < 0) return false;
    if (Plane_.distanceToVec(planes[3], point) < 0) return false;
    if (Plane_.distanceToVec(planes[4], point) < 0) return false;
    if (Plane_.distanceToVec(planes[5], point) < 0) return false;
    return true;
  };
}
