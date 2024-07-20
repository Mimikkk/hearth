import { Vec3, Vector3 } from './Vector3.js';
import type { BufferAttribute } from '../core/BufferAttribute.js';
import type { Object3D } from '../core/Object3D.js';
import type { Triangle } from './Triangle.js';
import type { Plane, Plane_ } from './Plane.js';
import { Sphere, Sphere_ } from './Sphere.js';
import type { Matrix4 } from './Matrix4.js';
import { Mesh } from '@modules/renderer/engine/objects/Mesh.js';
import { clamp, NumberArray } from '@modules/renderer/engine/math/MathUtils.js';
import { Const } from '@modules/renderer/engine/math/types.js';

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
    const isMesh = (obj: any): obj is Mesh => obj.isMesh;

    const geometry = object.geometry;

    if (geometry) {
      const positionAttribute = geometry.attributes.position;

      if (precise && positionAttribute && !object.isInstancedMesh) {
        for (let i = 0, l = positionAttribute.count; i < l; i++) {
          let _vector: Vector3 = new Vector3();

          if (isMesh(object)) {
            object.getVertexPosition(i, _vector);
          } else {
            _vector.fromBufferAttribute(positionAttribute, i);
          }

          Vec3.applyMat4(_vector, object.matrixWorld);
          this.expandByPoint(_vector);
        }
      } else {
        const _box = new Box3();

        if (object.boundingBox !== undefined) {
          if (object.boundingBox === null) object.computeBoundingBox();

          Box3_.fill_(_box, object.boundingBox!);
        } else {
          if (geometry.boundingBox === null) geometry.computeBoundingBox();

          Box3_.fill_(_box, geometry.boundingBox!);
        }

        // Box3_.applyMat4(_box, object.matrixWorld);
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

    const points = [
      new Vector3(this.min.x, this.min.y, this.min.z).applyMatrix4(matrix), // 000
      new Vector3(this.min.x, this.min.y, this.max.z).applyMatrix4(matrix), // 001
      new Vector3(this.min.x, this.max.y, this.min.z).applyMatrix4(matrix), // 010
      new Vector3(this.min.x, this.max.y, this.max.z).applyMatrix4(matrix), // 011
      new Vector3(this.max.x, this.min.y, this.min.z).applyMatrix4(matrix), // 100
      new Vector3(this.max.x, this.min.y, this.max.z).applyMatrix4(matrix), // 101
      new Vector3(this.max.x, this.max.y, this.min.z).applyMatrix4(matrix), // 110
      new Vector3(this.max.x, this.max.y, this.max.z).applyMatrix4(matrix), // 111
    ];

    this.setFromPoints(points);

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
    set(self, +Infinity, +Infinity, +Infinity, -Infinity, -Infinity, -Infinity);

  export const isEmpty = (self: Const<Box3_>): boolean =>
    self.max.x < self.min.x || self.max.y < self.min.y || self.max.z < self.min.z;

  export const set = (
    into: Box3_,
    minX: number,
    minY: number,
    minZ: number,
    maxX: number,
    maxY: number,
    maxZ: number,
  ): Box3_ => {
    into.min.x = minX;
    into.min.y = minY;
    into.min.z = minZ;
    into.max.x = maxX;
    into.max.y = maxY;
    into.max.z = maxZ;

    return into;
  };
  export const fill_ = (into: Box3_, { min, max }: Const<Box3_>): Box3_ => {
    into.min.x = min.x;
    into.min.y = min.y;
    into.min.z = min.z;
    into.max.x = max.x;
    into.max.y = max.y;
    into.max.z = max.z;

    return into;
  };

  export const clone = (from: Const<Box3_>): Box3_ => clone_(from, empty());
  export const clone_ = (from: Const<Box3_>, into: Box3_): Box3_ => fill_(into, from);

  export const copy = (from: Const<Box3_>): Box3_ => copy_(from, empty());
  export const copy_ = (from: Const<Box3_>, into: Box3_): Box3_ => {
    into.min = from.min;
    into.max = from.max;

    return into;
  };

  export const size = (self: Const<Box3_>): Vec3 => size_(self, Vec3.empty());
  export const size_ = (self: Const<Box3_>, into: Vec3): Vec3 =>
    isEmpty(self)
      ? Vec3.set(into, 0, 0, 0)
      : Vec3.set(into, self.max.x - self.min.x, self.max.y - self.min.y, self.max.z - self.min.z);

  export const center = (self: Const<Box3_>): Vec3 => center_(self, Vec3.empty());
  export const center_ = (self: Const<Box3_>, into: Vec3): Vec3 =>
    isEmpty(self)
      ? Vec3.set(into, 0, 0, 0)
      : Vec3.set(into, (self.min.x + self.max.x) / 2, (self.min.y + self.max.y) / 2, (self.min.z + self.max.z) / 2);

  export const expandCoord = (self: Box3_, coord: Const<Vec3>): Box3_ => {
    Vec3.min(self.min, coord);
    Vec3.max(self.max, coord);

    return self;
  };
  export const expandedCoord = (self: Const<Box3_>, vec: Const<Vec3>): Box3_ => expandCoord(clone(self), vec);

  export const expandCoords = (self: Box3_, vecs: Const<Vec3>[]): Box3_ => {
    for (let i = 0, it = vecs.length; i < it; ++i) expandCoord(self, vecs[i]);
    return self;
  };
  export const expandedCoords = (self: Const<Box3_>, vecs: Const<Vec3>[]): Box3_ => expandCoords(clone(self), vecs);

  export const expandVec = (self: Box3_, vec: Const<Vec3>): Box3_ => {
    Vec3.sub(self.min, vec);
    Vec3.add(self.max, vec);

    return self;
  };
  export const expandedVec = (self: Const<Box3_>, vec: Const<Vec3>): Box3_ => expandVec(clone(self), vec);

  export const expandScalar = (self: Box3_, scalar: number): Box3_ => {
    self.min.x -= scalar;
    self.min.y -= scalar;
    self.min.z -= scalar;
    self.max.x += scalar;
    self.max.y += scalar;
    self.max.z += scalar;

    return self;
  };
  export const expandedScalar = (self: Const<Box3_>, scalar: number): Box3_ => expandScalar(clone(self), scalar);

  const isMesh = (obj: any): obj is Mesh => obj.isMesh;
  const isInstancedMesh = (obj: any): obj is Mesh => obj.isInstancedMesh;
  const _vec1 = Vec3.empty();
  export const expandObject = (self: Const<Box3_>, object: Const<Object3D>, precise: boolean): Box3_ => {
    // Computes the world-axis-aligned bounding box of an object (including its children),
    // accounting for both the object's, and children's, world transforms

    object.updateWorldMatrix(false, false);

    const geometry = object.geometry;

    if (geometry) {
      // precise AABB computation based on vertex data requires at least a position attribute.
      // instancing isn't supported so far and uses the normal (conservative) code path.

      const positionAttribute = geometry.attributes.position;
      if (precise && positionAttribute && !isInstancedMesh(object)) {
        for (let i = 0, l = positionAttribute.count; i < l; i++) {
          if (isMesh(object)) {
            object.getVertexPosition(i, _vec1);
          } else {
            Vec3.fillAttribute(_vec1, positionAttribute, i);
          }

          Vec3.applyMat4(_vec1, object.matrixWorld);
          expandCoord(self, _vec1);
        }
      } else {
        const _box = empty();

        if (object.boundingBox !== undefined) {
          if (object.boundingBox === null) object.computeBoundingBox();

          fill_(_box, object.boundingBox!);
        } else {
          if (geometry.boundingBox === null) geometry.computeBoundingBox();

          fill_(_box, geometry.boundingBox!);
        }

        applyMat4(_box, object.matrixWorld);

        union(self, _box);
      }
    }

    const children = object.children;
    for (let i = 0, it = children.length; i < it; ++i) {
      expandObject(self, children[i], precise);
    }

    return self;
  };
  export const expandedObject = (self: Const<Box3_>, object: Const<Object3D>, precise: boolean): Box3_ =>
    expandObject(clone(self), object, precise);

  export const fromCenterAndRadius = (center: Const<Vec3>, radius: number): Box3_ =>
    fromCenterAndRadius_(center, radius, empty());
  export const fromCenterAndRadius_ = ({ x, y, z }: Const<Vec3>, radius: number, into: Box3_): Box3_ =>
    set(into, x - radius, y - radius, z - radius, x + radius, y + radius, z + radius);
  export const fillCenterAndRadius = (self: Box3_, center: Const<Vec3>, radius: number): Box3_ =>
    fromCenterAndRadius_(center, radius, self);

  export const fromCoords = (vecs: Const<Vec3>[]): Box3_ => fromCoords_(vecs, empty());
  export const fromCoords_ = (vecs: Const<Vec3>[], into: Box3_): Box3_ => expandCoords(into, vecs);
  export const fillCoords = (self: Box3_, vecs: Const<Vec3>[]): Box3_ => fromCoords_(vecs, clear(self));

  export const fromCenterAndSize = (center: Const<Vec3>, size: Const<Vec3>): Box3_ =>
    fromCenterAndSize_(center, size, empty());
  export const fromCenterAndSize_ = (center: Const<Vec3>, size: Const<Vec3>, into: Box3_): Box3_ => {
    const halfX = size.x / 2;
    const halfY = size.y / 2;
    const halfZ = size.z / 2;

    return set(
      into,
      center.x - halfX,
      center.y - halfY,
      center.z - halfZ,
      center.x + halfX,
      center.y + halfY,
      center.z + halfZ,
    );
  };
  export const fillCenterAndSize = (self: Box3_, center: Const<Vec3>, size: Const<Vec3>): Box3_ =>
    fromCenterAndSize_(center, size, self);

  export const fromAttribute = (attribute: BufferAttribute): Box3_ => fromAttribute_(attribute, empty());
  export const fromAttribute_ = (attribute: BufferAttribute, into: Box3_): Box3_ => {
    Box3_.clear(into);

    for (let i = 0; i < attribute.count; ++i) {
      expandCoord(into, Vec3.fillAttribute(Vec3.temp0, attribute, i));
    }

    return into;
  };
  export const fillAttribute = (self: Box3_, attribute: BufferAttribute): Box3_ => fromAttribute_(attribute, self);

  export const fromArray = <T extends NumberArray>(array: Const<T>, offset: number): Box3_ =>
    fromArray_(array, offset, empty());
  export const fromArray_ = <T extends NumberArray>(array: Const<T>, offset: number, into: Box3_): Box3_ =>
    set(
      into,
      array[offset],
      array[offset + 1],
      array[offset + 2],
      array[offset + 3],
      array[offset + 4],
      array[offset + 5],
    );
  export const fillArray = <T extends NumberArray>(self: Box3_, array: Const<T>, offset: number): Box3_ =>
    fromArray_(array, offset, self);
  export const intoArray = (self: Const<Box3_>) => intoArray_(self, 0, [0, 0, 0]);
  export const intoArray_ = <T extends NumberArray>({ min, max }: Const<Box3_>, offset: number, into: T): T => {
    into[offset] = min.x;
    into[offset + 1] = min.y;
    into[offset + 2] = min.z;
    into[offset + 3] = max.x;
    into[offset + 4] = max.y;
    into[offset + 5] = max.z;

    return into;
  };

  export const fromObject = (object: Const<Object3D>, precise: boolean): Box3_ => fromObject_(object, precise, empty());
  export const fromObject_ = (object: Const<Object3D>, precise: boolean, into: Box3_): Box3_ =>
    expandObject(clear(into), object, precise);
  export const fillObject = (self: Box3_, object: Const<Object3D>, precise: boolean): Box3_ =>
    fromObject_(object, precise, self);

  export const contains = (self: Const<Box3_>, box: Const<Box3_>): boolean =>
    self.min.x <= box.min.x &&
    box.max.x <= self.max.x &&
    self.min.y <= box.min.y &&
    box.max.y <= self.max.y &&
    self.min.z <= box.min.z &&
    box.max.z <= self.max.z;

  export const containsVec = (self: Const<Box3_>, { x, y, z }: Const<Vec3>): boolean =>
    !(x < self.min.x || x > self.max.x || y < self.min.y || y > self.max.y || z < self.min.z || z > self.max.z);

  export const intersects = (self: Const<Box3_>, box: Const<Box3_>): boolean =>
    box.max.x >= self.min.x &&
    box.min.x <= self.max.x &&
    box.max.y >= self.min.y &&
    box.min.y <= self.max.y &&
    box.max.z >= self.min.z &&
    box.min.z <= self.max.z;
  export const intersectsSphere = (self: Const<Box3_>, sphere: Const<Sphere_>): boolean => {
    const vec = clampVec_(self, sphere.center, Vec3.temp0);
    const distance = Vec3.distanceSqTo(vec, sphere.center);

    return distance <= sphere.radius * sphere.radius;
  };
  export const intersectsPlane = (self: Const<Box3_>, plane: Const<Plane_>): boolean => {
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
    axes: Const<NumberArray>,
    v0: Const<Vec3>,
    v1: Const<Vec3>,
    v2: Const<Vec3>,
    extents: Const<Vec3>,
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

  export const intersectsTriangle = (self: Const<Box3_>, triangle: Const<Triangle>): boolean => {
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

  export const clampVec = (self: Const<Box3_>, vec: Const<Vec3>): Vec3 => clampVec_(self, vec, Vec3.empty());
  export const clampVec_ = (self: Const<Box3_>, { x, y, z }: Const<Vec3>, into: Vec3): Vec3 => {
    into.x = clamp(x, self.min.x, self.max.x);
    into.y = clamp(y, self.min.y, self.max.y);
    into.z = clamp(z, self.min.z, self.max.z);

    return into;
  };

  export const intersect = (self: Box3_, box: Const<Box3_>): Box3_ => {
    Vec3.max(self.min, box.min);
    Vec3.min(self.max, box.max);

    if (isEmpty(self)) clear(self);

    return self;
  };
  export const intersected = (self: Const<Box3_>, box: Const<Box3_>): Box3_ => intersect(clone(self), box);

  export const union = (self: Box3_, box: Const<Box3_>): Box3_ => {
    Vec3.min(self.min, box.min);
    Vec3.max(self.max, box.max);

    return self;
  };
  export const united = (self: Const<Box3_>, box: Const<Box3_>): Box3_ => union(clone(self), box);

  export const translate = (self: Box3_, { x, y, z }: Const<Vec3>): Box3_ => {
    self.min.x += x;
    self.min.y += y;
    self.min.z += z;
    self.max.x += x;
    self.max.y += y;
    self.max.z += z;

    return self;
  };
  export const translated = (self: Const<Box3_>, vec: Const<Vec3>): Box3_ => translate(clone(self), vec);

  const _vec4 = Vec3.empty();
  export const sphere = (self: Const<Box3_>) => sphere_(self, Sphere_.empty());
  export const sphere_ = (self: Const<Box3_>, into: Sphere_): Sphere_ => {
    if (isEmpty(self)) return Sphere_.clear(into);

    center_(self, into.center);
    into.radius = Vec3.length(size_(self, _vec4)) * 0.5;

    return into;
  };

  const _vec2 = Vec3.empty();
  const _box1 = empty();
  export const applyMat4 = (self: Const<Box3_>, matrix: Const<Matrix4>): Box3_ => applyMat4_(self, matrix, self);
  export const applyMat4_ = (self: Const<Box3_>, matrix: Const<Matrix4>, into: Box3_): Box3_ => {
    if (isEmpty(self)) return clear(into);
    const { min, max } = fill_(_box1, self);
    clear(into);

    Vec3.set(_vec2, min.x, min.y, min.z);
    Vec3.applyMat4(_vec2, matrix);
    expandCoord(into, _vec2);

    Vec3.set(_vec2, min.x, min.y, max.z);
    Vec3.applyMat4(_vec2, matrix);
    expandCoord(into, _vec2);

    Vec3.set(_vec2, min.x, max.y, min.z);
    Vec3.applyMat4(_vec2, matrix);
    expandCoord(into, _vec2);

    Vec3.set(_vec2, min.x, max.y, max.z);
    Vec3.applyMat4(_vec2, matrix);
    expandCoord(into, _vec2);

    Vec3.set(_vec2, max.x, min.y, min.z);
    Vec3.applyMat4(_vec2, matrix);
    expandCoord(into, _vec2);

    Vec3.set(_vec2, max.x, min.y, max.z);
    Vec3.applyMat4(_vec2, matrix);
    expandCoord(into, _vec2);

    Vec3.set(_vec2, max.x, max.y, min.z);
    Vec3.applyMat4(_vec2, matrix);
    expandCoord(into, _vec2);

    Vec3.set(_vec2, max.x, max.y, max.z);
    Vec3.applyMat4(_vec2, matrix);
    expandCoord(into, _vec2);

    return into;
  };
  export const appliedMat4 = (self: Const<Box3_>, matrix: Const<Matrix4>): Box3_ => applyMat4_(self, matrix, empty());

  const _vec3 = Vec3.empty();
  export const distanceSqTo = (self: Const<Box3_>, vec: Const<Vec3>): number => {
    Vec3.clamp_(vec, self.min, self.max, _vec3);

    return Vec3.distanceSqTo(_vec3, vec);
  };
  export const distanceTo = (self: Const<Box3_>, vec: Const<Vec3>): number => Math.sqrt(distanceSqTo(self, vec));

  export const equals = (a: Const<Box3_>, b: Const<Box3_>): boolean =>
    Vec3.equals(a.min, b.min) && Vec3.equals(a.max, b.max);
}
