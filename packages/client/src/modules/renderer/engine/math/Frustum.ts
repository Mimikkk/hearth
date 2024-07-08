import { CoordinateSystem } from '../constants.js';
import { Vector3 } from './Vector3.js';
import { Sphere, Sphere_ } from './Sphere.js';
import { Plane } from './Plane.js';
import type { Matrix4 } from './Matrix4.js';
import type { Box3 } from './Box3.js';
import type { Sprite } from '../objects/Sprite.js';
import type { Object3D } from '../core/Object3D.js';

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

  setFromProjectionMatrix(matrix: Matrix4, coordinateSystem: CoordinateSystem = CoordinateSystem.WebGL): this {
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

      Sphere_.fill_(object.boundingSphere, _sphere);
      Sphere_.applyMat4(_sphere, object.matrixWorld);
    } else {
      const geometry = object.geometry!;
      if (geometry.boundingSphere === null) geometry.computeBoundingSphere();

      Sphere_.fill_(geometry.boundingSphere!, _sphere);
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
