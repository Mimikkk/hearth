import { Vec3 } from './Vec3.js';
import type { BufferAttribute } from '../core/BufferAttribute.js';
import type { Object3D } from '../core/Object3D.js';
import type { Triangle } from './Triangle.js';
import type { Plane } from './Plane.js';
import type { Sphere } from './Sphere.js';
import type { Mat4 } from './Mat4.js';
import { Mesh } from '@modules/renderer/engine/objects/Mesh.js';

export class Box3 {
  declare isBox3: true;
  declare ['constructor']: typeof Box3;

  constructor(
    public min: Vec3 = new Vec3(+Infinity, +Infinity, +Infinity),
    public max: Vec3 = new Vec3(-Infinity, -Infinity, -Infinity),
  ) {}

  set(min: Vec3, max: Vec3): this {
    this.min.copy(min);
    this.max.copy(max);

    return this;
  }

  setFromArray(array: number[]): this {
    this.makeEmpty();

    for (let i = 0, il = array.length; i < il; i += 3) {
      this.expandByPoint(new Vec3().fromArray(array, i));
    }

    return this;
  }

  setFromBufferAttribute(attribute: BufferAttribute<Float32Array>): this {
    this.makeEmpty();

    for (let i = 0, il = attribute.count; i < il; i++) {
      this.expandByPoint(new Vec3().fromBufferAttribute(attribute, i));
    }

    return this;
  }

  setFromPoints(points: Vec3[]): this {
    this.makeEmpty();

    for (let i = 0, il = points.length; i < il; i++) {
      this.expandByPoint(points[i]);
    }

    return this;
  }

  setFromCenterAndSize(center: Vec3, size: Vec3): this {
    const halfSize = new Vec3().copy(size).multiplyScalar(0.5);

    this.min.copy(center).sub(halfSize);
    this.max.copy(center).add(halfSize);

    return this;
  }

  setFromObject(object: Object3D, precise: boolean = false): this {
    this.makeEmpty();

    return this.expandByObject(object, precise);
  }

  clone(): Box3 {
    return new this.constructor().copy(this);
  }

  copy(box: Box3): this {
    this.min.copy(box.min);
    this.max.copy(box.max);

    return this;
  }

  makeEmpty(): this {
    this.min.x = this.min.y = this.min.z = +Infinity;
    this.max.x = this.max.y = this.max.z = -Infinity;

    return this;
  }

  isEmpty(): boolean {
    // this is a more robust check for empty than ( volume <= 0 ) because volume can get positive with two negative axes

    return this.max.x < this.min.x || this.max.y < this.min.y || this.max.z < this.min.z;
  }

  getCenter(target: Vec3): Vec3 {
    return this.isEmpty() ? target.set(0, 0, 0) : target.addVectors(this.min, this.max).multiplyScalar(0.5);
  }

  getSize(target: Vec3): Vec3 {
    return this.isEmpty() ? target.set(0, 0, 0) : target.subVectors(this.max, this.min);
  }

  expandByPoint(point: Vec3): this {
    this.min.min(point);
    this.max.max(point);

    return this;
  }

  expandByVector(vector: Vec3): this {
    this.min.sub(vector);
    this.max.add(vector);

    return this;
  }

  expandByScalar(scalar: number): this {
    this.min.addScalar(-scalar);
    this.max.addScalar(scalar);

    return this;
  }

  expandByObject(object: Object3D, precise: boolean = false): this {
    // Computes the world-axis-aligned bounding box of an object (including its children),
    // accounting for both the object's, and children's, world transforms

    object.updateWorldMatrix(false, false);

    const geometry = object.geometry;

    if (geometry) {
      const positionAttribute = geometry.getAttribute('position');

      // precise AABB computation based on vertex data requires at least a position attribute.
      // instancing isn't supported so far and uses the normal (conservative) code path.

      const isInstancedMesh = (obj: any): obj is Mesh => obj.isInstancedMesh;

      //@ts-expect-error
      if (precise === true && positionAttribute !== undefined && object.isInstancedMesh !== true) {
        for (let i = 0, l = positionAttribute.count; i < l; i++) {
          let _vector: Vec3 = new Vec3();

          const isMesh = (obj: any): obj is Mesh => obj.isMesh;

          if (isMesh(object)) {
            object.getVertexPosition(i, _vector);
          } else {
            _vector.fromBufferAttribute(positionAttribute, i);
          }

          _vector.applyMat4(object.matrixWorld);
          this.expandByPoint(_vector);
        }
      } else {
        const _box = new Box3();

        if (object.boundingBox !== undefined) {
          // object-level bounding box

          if (object.boundingBox === null) {
            object.computeBoundingBox();
          }

          _box.copy(object.boundingBox);
        } else {
          // geometry-level bounding box

          if (geometry.boundingBox === null) {
            geometry.computeBoundingBox();
          }

          _box.copy(geometry.boundingBox);
        }

        _box.applyMat4(object.matrixWorld);

        this.union(_box);
      }
    }

    const children = object.children;

    for (let i = 0, l = children.length; i < l; i++) {
      this.expandByObject(children[i], precise);
    }

    return this;
  }

  containsPoint(point: Vec3): boolean {
    return !(
      point.x < this.min.x ||
      point.x > this.max.x ||
      point.y < this.min.y ||
      point.y > this.max.y ||
      point.z < this.min.z ||
      point.z > this.max.z
    );
  }

  containsBox(box: Box3): boolean {
    return (
      this.min.x <= box.min.x &&
      box.max.x <= this.max.x &&
      this.min.y <= box.min.y &&
      box.max.y <= this.max.y &&
      this.min.z <= box.min.z &&
      box.max.z <= this.max.z
    );
  }

  getParameter(point: Vec3, target: Vec3): Vec3 {
    // This can potentially have a divide by zero if the box
    // has a size dimension of 0.

    return target.set(
      (point.x - this.min.x) / (this.max.x - this.min.x),
      (point.y - this.min.y) / (this.max.y - this.min.y),
      (point.z - this.min.z) / (this.max.z - this.min.z),
    );
  }

  intersectsBox(box: Box3): boolean {
    // using 6 splitting planes to rule out intersections.
    return (
      box.max.x >= this.min.x &&
      box.min.x <= this.max.x &&
      box.max.y >= this.min.y &&
      box.min.y <= this.max.y &&
      box.max.z >= this.min.z &&
      box.min.z <= this.max.z
    );
  }

  intersectsSphere(sphere: Sphere): boolean {
    // Find the point on the AABB closest to the sphere center.
    const _vector = new Vec3();
    this.clampPoint(sphere.center, _vector);

    // If that point is inside the sphere, the AABB and sphere intersect.
    return _vector.distanceToSquared(sphere.center) <= sphere.radius * sphere.radius;
  }

  intersectsPlane(plane: Plane): boolean {
    // We compute the minimum and maximum dot product values. If those values
    // are on the same side (back or front) of the plane, then there is no intersection.

    let min, max;

    if (plane.normal.x > 0) {
      min = plane.normal.x * this.min.x;
      max = plane.normal.x * this.max.x;
    } else {
      min = plane.normal.x * this.max.x;
      max = plane.normal.x * this.min.x;
    }

    if (plane.normal.y > 0) {
      min += plane.normal.y * this.min.y;
      max += plane.normal.y * this.max.y;
    } else {
      min += plane.normal.y * this.max.y;
      max += plane.normal.y * this.min.y;
    }

    if (plane.normal.z > 0) {
      min += plane.normal.z * this.min.z;
      max += plane.normal.z * this.max.z;
    } else {
      min += plane.normal.z * this.max.z;
      max += plane.normal.z * this.min.z;
    }

    return min <= -plane.constant && max >= -plane.constant;
  }

  intersectsTriangle(triangle: Triangle): boolean {
    if (this.isEmpty()) {
      return false;
    }

    // compute box center and extents
    const _center = this.getCenter(new Vec3());
    const _extents = new Vec3().subVectors(this.max, _center);

    // translate triangle to aabb origin
    const _v0 = new Vec3().subVectors(triangle.a, _center);
    const _v1 = new Vec3().subVectors(triangle.b, _center);
    const _v2 = new Vec3().subVectors(triangle.c, _center);

    // compute edge vectors for triangle
    const _f0 = new Vec3().subVectors(_v1, _v0);
    const _f1 = new Vec3().subVectors(_v2, _v1);
    const _f2 = new Vec3().subVectors(_v0, _v2);

    // test against axes that are given by cross product combinations of the edges of the triangle and the edges of the aabb
    // make an axis testing of each of the 3 sides of the aabb against each of the 3 sides of the triangle = 9 axis of separation
    // axis_ij = u_i x f_j (u0, u1, u2 = face normals of aabb = x,y,z axes vectors since aabb is axis aligned)
    let axes = [
      0,
      -_f0.z,
      _f0.y,
      0,
      -_f1.z,
      _f1.y,
      0,
      -_f2.z,
      _f2.y,
      _f0.z,
      0,
      -_f0.x,
      _f1.z,
      0,
      -_f1.x,
      _f2.z,
      0,
      -_f2.x,
      -_f0.y,
      _f0.x,
      0,
      -_f1.y,
      _f1.x,
      0,
      -_f2.y,
      _f2.x,
      0,
    ];
    if (!satForAxes(axes, _v0, _v1, _v2, _extents)) {
      return false;
    }

    // test 3 face normals from the aabb
    axes = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    if (!satForAxes(axes, _v0, _v1, _v2, _extents)) {
      return false;
    }

    // finally testing the face normal of the triangle
    // use already existing triangle edge vectors here
    const _triangleNormal = new Vec3().crossVectors(_f0, _f1);
    axes = [_triangleNormal.x, _triangleNormal.y, _triangleNormal.z];

    return satForAxes(axes, _v0, _v1, _v2, _extents);
  }

  clampPoint(point: Vec3, target: Vec3): Vec3 {
    return target.copy(point).clamp(this.min, this.max);
  }

  distanceToPoint(point: Vec3): number {
    return this.clampPoint(point, new Vec3(0, 0, 0)).distanceTo(point);
  }

  getBoundingSphere(target: Sphere): Sphere {
    if (this.isEmpty()) {
      target.makeEmpty();
    } else {
      this.getCenter(target.center);

      target.radius = this.getSize(new Vec3(0, 0, 0)).length() * 0.5;
    }

    return target;
  }

  intersect(box: Box3): this {
    this.min.max(box.min);
    this.max.min(box.max);

    // ensure that if there is no overlap, the result is fully empty, not slightly empty with non-inf/+inf values that will cause subsequence intersects to erroneously return valid values.
    if (this.isEmpty()) this.makeEmpty();

    return this;
  }

  union(box: Box3): this {
    this.min.min(box.min);
    this.max.max(box.max);

    return this;
  }

  applyMat4(matrix: Mat4): this {
    // transform of empty box is an empty box.
    if (this.isEmpty()) return this;

    // NOTE: I am using a binary pattern to specify all 2^3 combinations below

    this.setFromPoints([
      new Vec3(this.min.x, this.min.y, this.min.z).applyMat4(matrix), // 000
      new Vec3(this.min.x, this.min.y, this.max.z).applyMat4(matrix), // 001
      new Vec3(this.min.x, this.max.y, this.min.z).applyMat4(matrix), // 010
      new Vec3(this.min.x, this.max.y, this.max.z).applyMat4(matrix), // 011
      new Vec3(this.max.x, this.min.y, this.min.z).applyMat4(matrix), // 100
      new Vec3(this.max.x, this.min.y, this.max.z).applyMat4(matrix), // 101
      new Vec3(this.max.x, this.max.y, this.min.z).applyMat4(matrix), // 110
      new Vec3(this.max.x, this.max.y, this.max.z).applyMat4(matrix), // 111
    ]);

    return this;
  }

  translate(offset: Vec3): this {
    this.min.add(offset);
    this.max.add(offset);

    return this;
  }

  equals(box: Box3): boolean {
    return box.min.equals(this.min) && box.max.equals(this.max);
  }
}
Box3.prototype.isBox3 = true;

function satForAxes(axes: number[], v0: Vec3, v1: Vec3, v2: Vec3, extents: Vec3): boolean {
  for (let i = 0, j = axes.length - 3; i <= j; i += 3) {
    const _testAxis = new Vec3().fromArray(axes, i);
    // project the aabb onto the separating axis
    const r = extents.x * Math.abs(_testAxis.x) + extents.y * Math.abs(_testAxis.y) + extents.z * Math.abs(_testAxis.z);
    // project all 3 vertices of the triangle onto the separating axis
    const p0 = v0.dot(_testAxis);
    const p1 = v1.dot(_testAxis);
    const p2 = v2.dot(_testAxis);
    // actual test, basically see if either of the most extreme of the triangle points intersects r
    if (Math.max(-Math.max(p0, p1, p2), Math.min(p0, p1, p2)) > r) {
      // points of the projected triangle are outside the projected half-length of the aabb
      // the axis is separating and we can exit
      return false;
    }
  }

  return true;
}
