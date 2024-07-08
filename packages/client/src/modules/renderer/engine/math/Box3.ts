import { Vec3, Vector3 } from './Vector3.js';
import type { BufferAttribute } from '../core/BufferAttribute.js';
import type { Object3D } from '../core/Object3D.js';
import type { Triangle } from './Triangle.js';
import type { Plane } from './Plane.js';
import { Sphere, Sphere_ } from './Sphere.js';
import type { Matrix4 } from './Matrix4.js';
import { Mesh } from '@modules/renderer/engine/objects/Mesh.js';
import { clamp, NumberArray } from '@modules/renderer/engine/math/MathUtils.js';

const { vec3 } = Vec3;

export class Box3C {
  constructor(
    public min: Vector3 = new Vector3(+Infinity, +Infinity, +Infinity),
    public max: Vector3 = new Vector3(-Infinity, -Infinity, -Infinity),
  ) {}

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
          let _vector: Vector3 = new Vector3();

          const isMesh = (obj: any): obj is Mesh => obj.isMesh;

          if (isMesh(object)) {
            object.getVertexPosition(i, _vector);
          } else {
            _vector.fromBufferAttribute(positionAttribute, i);
          }

          _vector.applyMatrix4(object.matrixWorld);
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

        _box.applyMatrix4(object.matrixWorld);

        this.union(_box);
      }
    }

    const children = object.children;

    for (let i = 0, l = children.length; i < l; i++) {
      this.expandByObject(children[i], precise);
    }

    return this;
  }

  getBoundingSphere(target: Sphere): Sphere {
    if (this.isEmpty()) {
      target.makeEmpty();
    } else {
      this.getCenter(target.center);

      target.radius = this.getSize(new Vector3(0, 0, 0)).length() * 0.5;
    }

    return target;
  }
}

export class Box3 {
  declare isBox3: true;
  declare ['constructor']: typeof Box3;

  constructor(
    public min: Vector3 = new Vector3(+Infinity, +Infinity, +Infinity),
    public max: Vector3 = new Vector3(-Infinity, -Infinity, -Infinity),
  ) {}

  set(min: Vector3, max: Vector3): this {
    this.min.copy(min);
    this.max.copy(max);

    return this;
  }

  setFromArray(array: number[]): this {
    this.makeEmpty();

    for (let i = 0, il = array.length; i < il; i += 3) {
      this.expandByPoint(new Vector3().fromArray(array, i));
    }

    return this;
  }

  setFromBufferAttribute(attribute: BufferAttribute<Float32Array>): this {
    this.makeEmpty();

    for (let i = 0, il = attribute.count; i < il; i++) {
      this.expandByPoint(new Vector3().fromBufferAttribute(attribute, i));
    }

    return this;
  }

  setFromPoints(points: Vector3[]): this {
    this.makeEmpty();

    for (let i = 0, il = points.length; i < il; i++) {
      this.expandByPoint(points[i]);
    }

    return this;
  }

  setFromCenterAndSize(center: Vector3, size: Vector3): this {
    const halfSize = new Vector3().copy(size).multiplyScalar(0.5);

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

  getCenter(target: Vector3): Vector3 {
    return this.isEmpty() ? target.set(0, 0, 0) : target.addVectors(this.min, this.max).multiplyScalar(0.5);
  }

  getSize(target: Vector3): Vector3 {
    return this.isEmpty() ? target.set(0, 0, 0) : target.subVectors(this.max, this.min);
  }

  expandByPoint(point: Vector3): this {
    this.min.min(point);
    this.max.max(point);

    return this;
  }

  expandByVector(vector: Vector3): this {
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
          let _vector: Vector3 = new Vector3();

          const isMesh = (obj: any): obj is Mesh => obj.isMesh;

          if (isMesh(object)) {
            object.getVertexPosition(i, _vector);
          } else {
            _vector.fromBufferAttribute(positionAttribute, i);
          }

          _vector.applyMatrix4(object.matrixWorld);
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

        _box.applyMatrix4(object.matrixWorld);

        this.union(_box);
      }
    }

    const children = object.children;

    for (let i = 0, l = children.length; i < l; i++) {
      this.expandByObject(children[i], precise);
    }

    return this;
  }

  containsPoint(point: Vector3): boolean {
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

  getParameter(point: Vector3, target: Vector3): Vector3 {
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
    const _vector = new Vector3();
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
    const _center = this.getCenter(new Vector3());
    const _extents = new Vector3().subVectors(this.max, _center);

    // translate triangle to aabb origin
    const _v0 = new Vector3().subVectors(triangle.a, _center);
    const _v1 = new Vector3().subVectors(triangle.b, _center);
    const _v2 = new Vector3().subVectors(triangle.c, _center);

    // compute edge vectors for triangle
    const _f0 = new Vector3().subVectors(_v1, _v0);
    const _f1 = new Vector3().subVectors(_v2, _v1);
    const _f2 = new Vector3().subVectors(_v0, _v2);

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
    const _triangleNormal = new Vector3().crossVectors(_f0, _f1);
    axes = [_triangleNormal.x, _triangleNormal.y, _triangleNormal.z];

    return satForAxes(axes, _v0, _v1, _v2, _extents);
  }

  clampPoint(point: Vector3, target: Vector3): Vector3 {
    return target.copy(point).clamp(this.min, this.max);
  }

  distanceToPoint(point: Vector3): number {
    return this.clampPoint(point, new Vector3(0, 0, 0)).distanceTo(point);
  }

  getBoundingSphere(target: Sphere): Sphere {
    if (this.isEmpty()) {
      target.makeEmpty();
    } else {
      this.getCenter(target.center);

      target.radius = this.getSize(new Vector3(0, 0, 0)).length() * 0.5;
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

  applyMatrix4(matrix: Matrix4): this {
    // transform of empty box is an empty box.
    if (this.isEmpty()) return this;

    // NOTE: I am using a binary pattern to specify all 2^3 combinations below

    this.setFromPoints([
      new Vector3(this.min.x, this.min.y, this.min.z).applyMatrix4(matrix), // 000
      new Vector3(this.min.x, this.min.y, this.max.z).applyMatrix4(matrix), // 001
      new Vector3(this.min.x, this.max.y, this.min.z).applyMatrix4(matrix), // 010
      new Vector3(this.min.x, this.max.y, this.max.z).applyMatrix4(matrix), // 011
      new Vector3(this.max.x, this.min.y, this.min.z).applyMatrix4(matrix), // 100
      new Vector3(this.max.x, this.min.y, this.max.z).applyMatrix4(matrix), // 101
      new Vector3(this.max.x, this.max.y, this.min.z).applyMatrix4(matrix), // 110
      new Vector3(this.max.x, this.max.y, this.max.z).applyMatrix4(matrix), // 111
    ]);

    return this;
  }

  translate(offset: Vector3): this {
    this.min.add(offset);
    this.max.add(offset);

    return this;
  }

  equals(box: Box3): boolean {
    return box.min.equals(this.min) && box.max.equals(this.max);
  }
}

Box3.prototype.isBox3 = true;

function satForAxes(axes: number[], v0: Vector3, v1: Vector3, v2: Vector3, extents: Vector3): boolean {
  for (let i = 0, j = axes.length - 3; i <= j; i += 3) {
    const _testAxis = new Vector3().fromArray(axes, i);

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

export interface Box3_ {
  min: Vec3;
  max: Vec3;
}

export namespace Box3_ {
  export const create = (
    minX: number,
    minY: number,
    minZ: number,
    maxX: number,
    maxY: number,
    maxZ: number,
  ): Box3_ => ({
    min: { x: minX, y: minY, z: minZ },
    max: { x: maxX, y: maxY, z: maxZ },
  });

  export const empty = (): Box3_ => create(+Infinity, +Infinity, +Infinity, -Infinity, -Infinity, -Infinity);
  export const clear = (self: Box3_): Box3_ =>
    fill(self, +Infinity, +Infinity, +Infinity, -Infinity, -Infinity, -Infinity);

  export const isEmpty = (self: Readonly<Box3_>): boolean =>
    self.max.x < self.min.x || self.max.y < self.min.y || self.max.z < self.min.z;

  export const copy = ({ min, max }: Readonly<Box3_>): Box3_ => create(min.x, min.y, min.z, max.x, max.y, max.z);
  export const fill = (
    self: Box3_,
    minX: number,
    minY: number,
    minZ: number,
    maxX: number,
    maxY: number,
    maxZ: number,
  ): Box3_ => {
    self.min.x = minX;
    self.min.y = minY;
    self.min.z = minZ;
    self.max.x = maxX;
    self.max.y = maxY;
    self.max.z = maxZ;

    return self;
  };
  export const fill_ = (self: Readonly<Box3_>, into: Box3_): Box3_ => {
    into.min.x = self.min.x;
    into.min.y = self.min.y;
    into.min.z = self.min.z;
    into.max.x = self.max.x;
    into.max.y = self.max.y;
    into.max.z = self.max.z;

    return into;
  };

  export const clone = ({ min, max }: Readonly<Box3_>): Box3_ => ({ min, max });

  export const size = (self: Readonly<Box3_>): Vec3 => size_(self, Vec3.empty());
  export const size_ = (self: Readonly<Box3_>, into: Vec3): Vec3 =>
    isEmpty(self)
      ? Vec3.fill(into, 0, 0, 0)
      : Vec3.fill(into, self.max.x - self.min.x, self.max.y - self.min.y, self.max.z - self.min.z);

  export const center = (self: Readonly<Box3_>): Vec3 => center_(self, Vec3.empty());
  export const center_ = (self: Readonly<Box3_>, into: Vec3): Vec3 =>
    isEmpty(self)
      ? Vec3.fill(into, 0, 0, 0)
      : Vec3.fill(into, (self.min.x + self.max.x) / 2, (self.min.y + self.max.y) / 2, (self.min.z + self.max.z) / 2);

  export const expandByVec = (self: Box3_, { x, y, z }: Readonly<Vec3>): Box3_ => {
    if (x < self.min.x) self.min.x = x;
    if (y < self.min.y) self.min.y = y;
    if (z < self.min.z) self.min.z = z;
    if (x > self.max.x) self.max.x = x;
    if (y > self.max.y) self.max.y = y;
    if (z > self.max.z) self.max.z = z;

    return self;
  };
  export const expandedByVec = (self: Readonly<Box3_>, vec: Readonly<Vec3>): Box3_ => expandByVec(copy(self), vec);

  export const expandByVecs = (self: Box3_, vecs: Readonly<Vec3>[]): Box3_ => {
    for (let i = 0, it = vecs.length; i < it; ++i) expandByVec(self, vecs[i]);
    return self;
  };
  export const expandedByVecs = (self: Readonly<Box3_>, vecs: Readonly<Vec3>[]): Box3_ =>
    expandByVecs(copy(self), vecs);

  export const expandByScalar = (self: Box3_, scalar: number): Box3_ => {
    self.min.x -= scalar;
    self.min.y -= scalar;
    self.min.z -= scalar;
    self.max.x += scalar;
    self.max.y += scalar;
    self.max.z += scalar;

    return self;
  };
  export const expandedByScalar = (self: Readonly<Box3_>, scalar: number): Box3_ => expandByScalar(copy(self), scalar);

  export const fromCenterAndRadius = (center: Readonly<Vec3>, radius: number): Box3_ =>
    fromCenterAndRadius_(center, radius, empty());
  export const fromCenterAndRadius_ = ({ x, y, z }: Readonly<Vec3>, radius: number, into: Box3_): Box3_ =>
    fill(into, x - radius, y - radius, z - radius, x + radius, y + radius, z + radius);
  export const fillCenterAndRadius = (self: Box3_, center: Readonly<Vec3>, radius: number): Box3_ =>
    fromCenterAndRadius_(center, radius, self);

  export const fromVecs = (vecs: Readonly<Vec3>[]): Box3_ => fromVecs_(vecs, empty());
  export const fromVecs_ = (vecs: Readonly<Vec3>[], into: Box3_): Box3_ => expandByVecs(into, vecs);
  export const fillVecs = (self: Box3_, vecs: Readonly<Vec3>[]): Box3_ => fromVecs_(vecs, self);

  export const fromCenterAndSize = (center: Readonly<Vec3>, size: Readonly<Vec3>): Box3_ =>
    fromCenterAndSize_(center, size, empty());
  export const fromCenterAndSize_ = (center: Readonly<Vec3>, size: Readonly<Vec3>, into: Box3_): Box3_ => {
    const halfX = size.x / 2;
    const halfY = size.y / 2;
    const halfZ = size.z / 2;

    return fill(
      into,
      center.x - halfX,
      center.y - halfY,
      center.z - halfZ,
      center.x + halfX,
      center.y + halfY,
      center.z + halfZ,
    );
  };
  export const fillCenterAndSize = (self: Box3_, center: Readonly<Vec3>, size: Readonly<Vec3>): Box3_ =>
    fromCenterAndSize_(center, size, self);

  export const fromAttribute = (attribute: BufferAttribute): Box3_ => fromAttribute_(attribute, empty());
  export const fromAttribute_ = (attribute: BufferAttribute, into: Box3_): Box3_ => {
    Box3_.clear(into);

    for (let i = 0; i < attribute.count; ++i) {
      expandByVec(into, Vec3.fillAttribute(Vec3.temp0, attribute, i));
    }

    return into;
  };
  export const fillAttribute = (self: Box3_, attribute: BufferAttribute): Box3_ => fromAttribute_(attribute, self);

  export const fromArray = <T extends NumberArray>(array: Readonly<T>, offset: number): Box3_ =>
    fromArray_(array, offset, empty());
  export const fromArray_ = <T extends NumberArray>(array: Readonly<T>, offset: number, into: Box3_): Box3_ =>
    fill(
      into,
      array[offset],
      array[offset + 1],
      array[offset + 2],
      array[offset + 3],
      array[offset + 4],
      array[offset + 5],
    );
  export const fillArray = <T extends NumberArray>(self: Box3_, array: Readonly<T>, offset: number): Box3_ =>
    fromArray_(array, offset, self);
  export const intoArray = (self: Readonly<Box3_>) => intoArray_(self, 0, [0, 0, 0]);
  export const intoArray_ = <T extends NumberArray>({ min, max }: Readonly<Box3_>, offset: number, into: T): T => {
    into[offset] = min.x;
    into[offset + 1] = min.y;
    into[offset + 2] = min.z;
    into[offset + 3] = max.x;
    into[offset + 4] = max.y;
    into[offset + 5] = max.z;

    return into;
  };

  export const fromObject = (object: Readonly<Object3D>, precise: boolean): Box3_ =>
    fromObject_(object, precise, empty());
  export const fromObject_ = (object: Readonly<Object3D>, precise: boolean, into: Box3_): Box3_ => {
    clear(into);
    return expandByObject(into, object, precise);
  };
  export const fillObject = (self: Box3_, object: Readonly<Object3D>, precise: boolean): Box3_ =>
    fromObject_(object, precise, self);

  export const contains = (self: Readonly<Box3_>, box: Readonly<Box3_>): boolean =>
    self.min.x <= box.min.x &&
    box.max.x <= self.max.x &&
    self.min.y <= box.min.y &&
    box.max.y <= self.max.y &&
    self.min.z <= box.min.z &&
    box.max.z <= self.max.z;

  export const containsVec = (self: Readonly<Box3_>, { x, y, z }: Readonly<Vec3>): boolean =>
    !(x < self.min.x || x > self.max.x || y < self.min.y || y > self.max.y || z < self.min.z || z > self.max.z);

  export const intersects = (self: Readonly<Box3_>, box: Readonly<Box3_>): boolean =>
    box.max.x >= self.min.x &&
    box.min.x <= self.max.x &&
    box.max.y >= self.min.y &&
    box.min.y <= self.max.y &&
    box.max.z >= self.min.z &&
    box.min.z <= self.max.z;
  export const intersectsSphere = (self: Readonly<Box3_>, sphere: Readonly<Sphere_>): boolean => {
    const vec = clampVec_(self, sphere.center, Vec3.temp0);
    const distance = Vec3.distanceSqTo(vec, sphere.center);

    return distance <= sphere.radius * sphere.radius;
  };
  export const intersectsPlane = (self: Readonly<Box3_>, plane: Readonly<Plane>): boolean => {
    let min: number;
    let max: number;

    if (plane.normal.x > 0) {
      min = plane.normal.x * self.min.x;
      max = plane.normal.x * self.max.x;
    } else {
      min = plane.normal.x * self.max.x;
      max = plane.normal.x * self.min.x;
    }

    if (plane.normal.y > 0) {
      min += plane.normal.y * self.min.y;
      max += plane.normal.y * self.max.y;
    } else {
      min += plane.normal.y * self.max.y;
      max += plane.normal.y * self.min.y;
    }

    if (plane.normal.z > 0) {
      min += plane.normal.z * self.min.z;
      max += plane.normal.z * self.max.z;
    } else {
      min += plane.normal.z * self.max.z;
      max += plane.normal.z * self.min.z;
    }

    return min <= -plane.constant && max >= -plane.constant;
  };

  const isSatForAxes = (
    axes: Readonly<NumberArray>,
    v0: Readonly<Vec3>,
    v1: Readonly<Vec3>,
    v2: Readonly<Vec3>,
    extents: Readonly<Vec3>,
  ): boolean => {
    for (let i = 0, j = axes.length - 3; i <= j; i += 3) {
      const _testAxis = Vec3.fromArray_(axes, i, Vec3.temp9);

      // project the aabb onto the separating axis
      const r =
        extents.x * Math.abs(_testAxis.x) + extents.y * Math.abs(_testAxis.y) + extents.z * Math.abs(_testAxis.z);

      // project all 3 vertices of the triangle onto the separating axis
      const p0 = Vec3.dot(v0, _testAxis);
      const p1 = Vec3.dot(v1, _testAxis);
      const p2 = Vec3.dot(v2, _testAxis);

      // actual test, basically see if either of the most extreme of the triangle points intersects r
      if (Math.max(-Math.max(p0, p1, p2), Math.min(p0, p1, p2)) > r) {
        // points of the projected triangle are outside the projected half-length of the aabb
        // the axis is separating and we can exit
        return false;
      }
    }

    return true;
  };

  export const intersectsTriangle = (self: Readonly<Box3_>, triangle: Readonly<Triangle>): boolean => {
    if (isEmpty(self)) return false;

    // compute box center and extents
    const _center = center_(self, Vec3.temp0);
    const _extents = Vec3.sub_(self.max, _center, Vec3.temp1);

    // translate triangle to aabb origin
    const _v0 = Vec3.sub_(triangle.a, _center, Vec3.temp2);
    const _v1 = Vec3.sub_(triangle.b, _center, Vec3.temp3);
    const _v2 = Vec3.sub_(triangle.c, _center, Vec3.temp4);

    // compute edge vectors for triangle
    const _f0 = Vec3.sub_(_v1, _v0, Vec3.temp5);
    const _f1 = Vec3.sub_(_v2, _v1, Vec3.temp6);
    const _f2 = Vec3.sub_(_v0, _v2, Vec3.temp7);

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
    if (!isSatForAxes(axes, _v0, _v1, _v2, _extents)) {
      return false;
    }

    // test 3 face normals from the aabb
    axes = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    if (!isSatForAxes(axes, _v0, _v1, _v2, _extents)) {
      return false;
    }

    // finally testing the face normal of the triangle
    // use already existing triangle edge vectors here
    const _triangleNormal = Vec3.cross_(_f0, _f1, Vec3.temp8);
    axes = [_triangleNormal.x, _triangleNormal.y, _triangleNormal.z];

    return isSatForAxes(axes, _v0, _v1, _v2, _extents);
  };

  export const clampVec = (self: Readonly<Box3_>, vec: Readonly<Vec3>): Vec3 => clampVec_(self, vec, Vec3.empty());
  export const clampVec_ = (self: Readonly<Box3_>, { x, y, z }: Readonly<Vec3>, into: Vec3): Vec3 => {
    into.x = clamp(x, self.min.x, self.max.x);
    into.y = clamp(y, self.min.y, self.max.y);
    into.z = clamp(z, self.min.z, self.max.z);

    return into;
  };

  export const intersect = (self: Box3_, box: Readonly<Box3_>): Box3_ => {
    if (box.min.x > self.min.x) self.min.x = box.min.x;
    if (box.min.y > self.min.y) self.min.y = box.min.y;
    if (box.min.z > self.min.z) self.min.z = box.min.z;
    if (box.max.x < self.max.x) self.max.x = box.max.x;
    if (box.max.y < self.max.y) self.max.y = box.max.y;
    if (box.max.z < self.max.z) self.max.z = box.max.z;

    if (isEmpty(self)) clear(self);

    return self;
  };
  export const intersected = (self: Readonly<Box3_>, box: Readonly<Box3_>): Box3_ => intersect(copy(self), box);
  export const intersectSphere = (self: Readonly<Box3_>): Sphere_ => intersectSphere_(self, Sphere_.empty());
  export const intersectSphere_ = (self: Readonly<Box3_>, into: Sphere_): Sphere_ => {
    const center = center_(self, Vec3.temp0);
    const size = size_(self, Vec3.temp1);

    return Sphere_.fromCenterAndSize(into, center, size.length() / 2);
  };

  export const union = (self: Box3_, box: Readonly<Box3_>): Box3_ => {
    if (box.min.x < self.min.x) self.min.x = box.min.x;
    if (box.min.y < self.min.y) self.min.y = box.min.y;
    if (box.min.z < self.min.z) self.min.z = box.min.z;
    if (box.max.x > self.max.x) self.max.x = box.max.x;
    if (box.max.y > self.max.y) self.max.y = box.max.y;
    if (box.max.z > self.max.z) self.max.z = box.max.z;

    return self;
  };
  export const united = (self: Readonly<Box3_>, box: Readonly<Box3_>): Box3_ => union(copy(self), box);

  export const translate = (self: Box3_, { x, y, z }: Readonly<Vec3>): Box3_ => {
    self.min.x += x;
    self.min.y += y;
    self.min.z += z;
    self.max.x += x;
    self.max.y += y;
    self.max.z += z;

    return self;
  };
  export const translated = (self: Readonly<Box3_>, vec: Readonly<Vec3>): Box3_ => translate(copy(self), vec);

  export const applyMat4 = (self: Readonly<Box3_>, matrix: Readonly<Matrix4>): Box3_ => applyMat4_(self, matrix, self);
  export const applyMat4_ = (self: Readonly<Box3_>, matrix: Readonly<Matrix4>, into: Box3_): Box3_ => {
    if (isEmpty(self)) return clear(into);

    fill_(self, into);

    Vec3.applyMat4(Vec3.fill(Vec3.temp0, self.min.x, self.min.y, self.min.z), matrix);
    expandByVec(into, Vec3.temp0);

    Vec3.applyMat4(Vec3.fill(Vec3.temp0, self.min.x, self.min.y, self.max.z), matrix);
    expandByVec(into, Vec3.temp0);

    Vec3.applyMat4(Vec3.fill(Vec3.temp0, self.min.x, self.max.y, self.min.z), matrix);
    expandByVec(into, Vec3.temp0);

    Vec3.applyMat4(Vec3.fill(Vec3.temp0, self.min.x, self.max.y, self.max.z), matrix);
    expandByVec(into, Vec3.temp0);

    Vec3.applyMat4(Vec3.fill(Vec3.temp0, self.max.x, self.min.y, self.min.z), matrix);
    expandByVec(into, Vec3.temp0);

    Vec3.applyMat4(Vec3.fill(Vec3.temp0, self.max.x, self.min.y, self.max.z), matrix);
    expandByVec(into, Vec3.temp0);

    Vec3.applyMat4(Vec3.fill(Vec3.temp0, self.max.x, self.max.y, self.min.z), matrix);
    expandByVec(into, Vec3.temp0);

    Vec3.applyMat4(Vec3.fill(Vec3.temp0, self.max.x, self.max.y, self.max.z), matrix);
    expandByVec(into, Vec3.temp0);

    return into;
  };

  export const distanceSqTo = (self: Readonly<Box3_>, vec: Readonly<Vec3>): number => {
    const x = clamp(vec.x, self.min.x, self.max.x);
    const y = clamp(vec.y, self.min.y, self.max.y);
    const z = clamp(vec.z, self.min.z, self.max.z);

    return x * x + y * y + z * z;
  };
  export const distanceTo = (self: Readonly<Box3_>, vec: Readonly<Vec3>): number => Math.sqrt(distanceSqTo(self, vec));

  export const equals = (a: Readonly<Box3_>, b: Readonly<Box3_>): boolean =>
    b.min.x === a.min.x &&
    b.min.y === a.min.y &&
    b.min.z === a.min.z &&
    b.max.x === a.max.x &&
    b.max.y === a.max.y &&
    b.max.z === a.max.z;

  export const temp0 = empty();
  export const temp1 = empty();
  export const temp2 = empty();
  export const temp3 = empty();
  export const temp4 = empty();
  export const temp5 = empty();
  export const temp6 = empty();
  export const temp7 = empty();
  export const temp8 = empty();
  export const temp9 = empty();
}
