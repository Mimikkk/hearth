import { CoordinateSystem } from '../constants.js';
import { Vec3, Vector3 } from './Vector3.js';
import { Sphere, Sphere_ } from './Sphere.js';
import { Plane, Plane_ } from './Plane.js';
import type { Matrix4 } from './Matrix4.js';
import type { Box3, Box3_ } from './Box3.js';
import type { Sprite } from '../objects/Sprite.js';
import type { Object3D } from '../core/Object3D.js';
import { Const } from '@modules/renderer/engine/math/types.js';

export class Frustum {
  declare ['constructor']: typeof Frustum;
  planes: Plane[];

  constructor(
    p0: Plane = new Plane(),
    p1: Plane = new Plane(),
    p2: Plane = new Plane(),
    p3: Plane = new Plane(),
    p4: Plane = new Plane(),
    p5: Plane = new Plane(),
  ) {
    this.planes = [p0, p1, p2, p3, p4, p5];
  }

  set(p0: Plane, p1: Plane, p2: Plane, p3: Plane, p4: Plane, p5: Plane): this {
    const planes = this.planes;

    planes[0].copy(p0);
    planes[1].copy(p1);
    planes[2].copy(p2);
    planes[3].copy(p3);
    planes[4].copy(p4);
    planes[5].copy(p5);

    return this;
  }

  copy(frustum: Frustum): this {
    const planes = this.planes;

    for (let i = 0; i < 6; i++) {
      planes[i].copy(frustum.planes[i]);
    }

    return this;
  }

  setFromProjectionMatrix(matrix: Matrix4, coordinateSystem: CoordinateSystem = CoordinateSystem.WebGPU): this {
    const planes = this.planes;
    const me = matrix.elements;
    const me0 = me[0],
      me1 = me[1],
      me2 = me[2],
      me3 = me[3];
    const me4 = me[4],
      me5 = me[5],
      me6 = me[6],
      me7 = me[7];
    const me8 = me[8],
      me9 = me[9],
      me10 = me[10],
      me11 = me[11];
    const me12 = me[12],
      me13 = me[13],
      me14 = me[14],
      me15 = me[15];

    planes[0].setComponents(me3 - me0, me7 - me4, me11 - me8, me15 - me12).normalize();
    planes[1].setComponents(me3 + me0, me7 + me4, me11 + me8, me15 + me12).normalize();
    planes[2].setComponents(me3 + me1, me7 + me5, me11 + me9, me15 + me13).normalize();
    planes[3].setComponents(me3 - me1, me7 - me5, me11 - me9, me15 - me13).normalize();
    planes[4].setComponents(me3 - me2, me7 - me6, me11 - me10, me15 - me14).normalize();

    if (coordinateSystem === CoordinateSystem.WebGL) {
      planes[5].setComponents(me3 + me2, me7 + me6, me11 + me10, me15 + me14).normalize();
    } else if (coordinateSystem === CoordinateSystem.WebGPU) {
      planes[5].setComponents(me2, me6, me10, me14).normalize();
    } else {
      throw new Error('engine.Frustum.setFromProjectionMatrix(): Invalid coordinate system: ' + coordinateSystem);
    }

    return this;
  }

  intersectsObject(object: Object3D): boolean {
    const _sphere = Sphere_.empty();

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

    return this.intersectsSphere(_sphere);
  }

  intersectsSprite(sprite: Sprite): boolean {
    const _sphere = new Sphere(new Vector3(0, 0, 0), 0.7071067811865476);
    _sphere.applyMatrix4(sprite.matrixWorld);

    return this.intersectsSphere(_sphere);
  }

  intersectsSphere(sphere: Sphere_): boolean {
    const planes = this.planes;
    const center = sphere.center;
    const negRadius = -sphere.radius;

    for (let i = 0; i < 6; i++) {
      const distance = planes[i].distanceToPoint(center);

      if (distance < negRadius) {
        return false;
      }
    }

    return true;
  }

  intersectsBox(box: Box3): boolean {
    const planes = this.planes;

    for (let i = 0; i < 6; i++) {
      const plane = planes[i];

      // corner at max distance

      const _vector = new Vector3(
        plane.normal.x > 0 ? box.min.x : box.max.x,
        plane.normal.y > 0 ? box.min.y : box.max.y,
        plane.normal.z > 0 ? box.min.z : box.max.z,
      );

      if (plane.distanceToPoint(_vector) < 0) {
        return false;
      }
    }

    return true;
  }

  containsPoint(point: Vector3): boolean {
    const planes = this.planes;

    for (let i = 0; i < 6; i++) {
      if (planes[i].distanceToPoint(point) < 0) {
        return false;
      }
    }

    return true;
  }

  clone(): Frustum {
    return new this.constructor().copy(this);
  }
}

export interface Frustum_ {
  planes: [Plane_, Plane_, Plane_, Plane_, Plane_, Plane_];
}

export namespace Frustum_ {
  export const create = (p0: Plane_, p1: Plane_, p2: Plane_, p3: Plane_, p4: Plane_, p5: Plane_): Frustum_ => ({
    planes: [p0, p1, p2, p3, p4, p5],
  });

  export const empty = (): Frustum_ =>
    create(Plane_.empty(), Plane_.empty(), Plane_.empty(), Plane_.empty(), Plane_.empty(), Plane_.empty());
  export const set = (
    self: Frustum_,
    p0: Plane_,
    p1: Plane_,
    p2: Plane_,
    p3: Plane_,
    p4: Plane_,
    p5: Plane_,
  ): Frustum_ => {
    Plane_.fill_(self.planes[0], p0);
    Plane_.fill_(self.planes[1], p1);
    Plane_.fill_(self.planes[2], p2);
    Plane_.fill_(self.planes[3], p3);
    Plane_.fill_(self.planes[4], p4);
    Plane_.fill_(self.planes[5], p5);
    return self;
  };
  export const fill_ = (self: Frustum_, { planes: [p0, p1, p2, p3, p4, p5] }: Const<Frustum_>): Frustum_ =>
    set(self, p0, p1, p2, p3, p4, p5);

  export const fromProjection = (matrix: Const<Matrix4>): Frustum_ => fromProjection_(matrix, empty());

  export const fromProjection_ = (matrix: Const<Matrix4>, into: Frustum_): Frustum_ => {
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
  export const fillProjection = (self: Frustum_, matrix: Const<Matrix4>): Frustum_ => fromProjection_(matrix, self);

  export const copy = (from: Frustum_): Frustum_ => copy_(from, empty());
  export const copy_ = (from: Frustum_, into: Frustum_): Frustum_ => {
    into.planes = from.planes;
    return into;
  };

  export const clone = (from: Const<Frustum_>): Frustum_ => clone_(from, empty());
  export const clone_ = (from: Const<Frustum_>, into: Frustum_): Frustum_ => fill_(into, from);

  export const intersectsObject = (self: Const<Frustum_>, object: Object3D): boolean => {
    const _sphere = Sphere_.empty();

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
  export const intersectsSprite = (self: Const<Frustum_>, sprite: Sprite): boolean => {
    Sphere_.set(_sphere, 0, 0, 0, cosPi4);
    Sphere_.applyMat4(_sphere, sprite.matrixWorld);

    return intersectsSphere(self, _sphere);
  };
  export const intersectsSphere = ({ planes }: Const<Frustum_>, { center, radius }: Sphere_): boolean => {
    radius = -radius;

    if (Plane_.distanceToVec(planes[0], center) < radius) return false;
    if (Plane_.distanceToVec(planes[1], center) < radius) return false;
    if (Plane_.distanceToVec(planes[2], center) < radius) return false;
    if (Plane_.distanceToVec(planes[3], center) < radius) return false;
    if (Plane_.distanceToVec(planes[4], center) < radius) return false;
    if (Plane_.distanceToVec(planes[5], center) < radius) return false;
    return true;
  };

  const _vec3 = Vec3.empty();

  const setVec = (plane: Const<Plane_>, box: Const<Box3_>): Vec3 =>
    Vec3.set(
      _vec3,
      plane.normal.x > 0 ? box.min.x : box.max.x,
      plane.normal.y > 0 ? box.min.y : box.max.y,
      plane.normal.z > 0 ? box.min.z : box.max.z,
    );
  export const intersectsBox = ({ planes }: Const<Frustum_>, box: Box3_): boolean => {
    if (Plane_.distanceToVec(planes[0], setVec(planes[0], box)) < 0) return false;
    if (Plane_.distanceToVec(planes[1], setVec(planes[1], box)) < 0) return false;
    if (Plane_.distanceToVec(planes[2], setVec(planes[2], box)) < 0) return false;
    if (Plane_.distanceToVec(planes[3], setVec(planes[3], box)) < 0) return false;
    if (Plane_.distanceToVec(planes[4], setVec(planes[4], box)) < 0) return false;
    if (Plane_.distanceToVec(planes[5], setVec(planes[5], box)) < 0) return false;

    return true;
  };
  export const containsVec = ({ planes }: Const<Frustum_>, point: Const<Vec3>): boolean =>
    Plane_.distanceToVec(planes[0], point) >= 0 &&
    Plane_.distanceToVec(planes[1], point) >= 0 &&
    Plane_.distanceToVec(planes[2], point) >= 0 &&
    Plane_.distanceToVec(planes[3], point) >= 0 &&
    Plane_.distanceToVec(planes[4], point) >= 0 &&
    Plane_.distanceToVec(planes[5], point) >= 0;
}
