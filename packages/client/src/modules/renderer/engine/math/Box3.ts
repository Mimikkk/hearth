import { IVec3, Vec3 } from './Vector3.js';
import type { BufferAttribute } from '../core/BufferAttribute.js';
import type { Object3D } from '../core/Object3D.js';
import type { Triangle } from './Triangle.js';
import type { Plane, Plane_ } from './Plane.js';
import { Sphere, Sphere_ } from './Sphere.js';
import type { Matrix4 } from './Matrix4.js';
import { Mesh } from '@modules/renderer/engine/objects/Mesh.js';
import { clamp, NumberArray } from '@modules/renderer/engine/math/MathUtils.js';
import { Const } from '@modules/renderer/engine/math/types.js';
import { Attribute } from '@modules/renderer/engine/renderers/common/Attributes.js';

export class Box3 {
  declare isBox3: true;
  declare ['constructor']: typeof Box3;

  constructor(
    public min: Vec3 = Vec3.new(+Infinity, +Infinity, +Infinity),
    public max: Vec3 = Vec3.new(-Infinity, -Infinity, -Infinity),
  ) {}

  static new(
    min: Vec3 = Vec3.new(+Infinity, +Infinity, +Infinity),
    max: Vec3 = Vec3.new(-Infinity, -Infinity, -Infinity),
  ): Box3 {
    return new Box3(min, max);
  }

  static empty(): Box3 {
    return Box3.new();
  }

  static clone(box: Const<Box3>, into: Box3 = Box3.empty()): Box3 {
    return into.from(box);
  }

  static is(box: any): box is Box3 {
    return box?.isBox3 === true;
  }

  static into(into: Box3, box: Const<Box3>): Box3 {
    return into.from(box);
  }

  static from(box: Const<Box3>, into: Box3 = Box3.empty()): Box3 {
    return into.from(box);
  }

  static fromParams(
    minX: number,
    minY: number,
    minZ: number,
    maxX: number,
    maxY: number,
    maxZ: number,
    into: Box3 = Box3.new(),
  ): Box3 {
    return into.setParams(minX, minY, minZ, maxX, maxY, maxZ);
  }

  static fromCenterAndSize(center: Const<Vec3>, size: Const<Vec3>, into: Box3 = Box3.empty()): Box3 {
    return into.fromCenterAndSize(center, size);
  }

  static fromCoords(coords: Const<Vec3>[], into: Box3 = Box3.empty()): Box3 {
    return into.fromCoords(coords);
  }

  static fromAttribute(attribute: Attribute, into: Box3 = Box3.empty()): Box3 {
    return into.fromAttribute(attribute);
  }

  static fromArray(array: number[], into: Box3 = Box3.empty()): Box3 {
    return into.fromArray(array);
  }

  static fromObject(object: Object3D, precise: boolean = false, into: Box3 = Box3.empty()): Box3 {
    return into.fromObject(object, precise);
  }

  set(min: Const<Vec3>, max: Const<Vec3>): this {
    this.min.from(min);
    this.max.from(max);

    return this;
  }

  setMin(min: Const<Vec3>): this {
    this.min.from(min);
    return this;
  }

  setMax(max: Const<Vec3>): this {
    this.max.from(max);
    return this;
  }

  setParams(minX: number, minY: number, minZ: number, maxX: number, maxY: number, maxZ: number): this {
    this.min.set(minX, minY, minZ);
    this.max.set(maxX, maxY, maxZ);

    return this;
  }

  fromArray(array: number[]): this {
    this.clear();

    for (let i = 0, il = array.length; i < il; i += 3) {
      this.expandCoord(_v1.fromArray(array, i));
    }

    return this;
  }

  fromAttribute(attribute: Attribute): this {
    this.clear();

    for (let i = 0, il = attribute.count; i < il; i++) {
      this.expandCoord(_v1.fromAttribute(attribute, i));
    }

    return this;
  }

  fromCoords(points: Vec3[]): this {
    this.clear();

    for (let i = 0, il = points.length; i < il; i++) {
      this.expandCoord(points[i]);
    }

    return this;
  }

  fromCenterAndSize(center: Const<Vec3>, size: Const<Vec3>): this {
    const half = _v1.from(size).scale(0.5);

    this.min.from(center).sub(half);
    this.max.from(center).add(half);

    return this;
  }

  fromObject(object: Const<Object3D>, precise: boolean = false): this {
    this.clear();
    return this.expandObject(object, precise);
  }

  clone(into: Box3 = Box3.empty()): Box3 {
    return into.from(this);
  }

  from(box: Const<Box3>): this {
    this.min.from(box.min);
    this.max.from(box.max);

    return this;
  }

  clear(): this {
    this.min.x = this.min.y = this.min.z = +Infinity;
    this.max.x = this.max.y = this.max.z = -Infinity;

    return this;
  }

  isEmpty(): boolean {
    // this is a more robust check for empty than ( volume <= 0 ) because volume can get positive with two negative axes

    return this.max.x < this.min.x || this.max.y < this.min.y || this.max.z < this.min.z;
  }

  center(into: Vec3 = Vec3.new()): Vec3 {
    return this.isEmpty() ? into.set(0, 0, 0) : into.from(this.min).add(this.max).scale(0.5);
  }

  size(into: Vec3 = Vec3.new()): Vec3 {
    return this.isEmpty() ? into.set(0, 0, 0) : into.from(this.max).sub(this.min);
  }

  expandCoord(coord: Const<Vec3>): this {
    this.min.min(coord);
    this.max.max(coord);
    return this;
  }

  expandVec(vec: Const<Vec3>): this {
    this.min.sub(vec);
    this.max.add(vec);
    return this;
  }

  expandScalar(scalar: number): this {
    this.min.subScalar(scalar);
    this.max.addScalar(scalar);
    return this;
  }

  expandObject(object: Const<Object3D>, precise: boolean = false): this {
    object.updateWorldMatrix(false, false);

    const geometry = object.geometry;

    if (geometry) {
      const position = geometry.attributes.position;

      if (precise && position && !object.isInstancedMesh) {
        for (let i = 0, l = position.count; i < l; i++) {
          let _vec: Vec3 = new Vec3();

          if (isMesh(object)) {
            object.getVertexPosition(i, _vec);
          } else {
            _vec.fromAttribute(position, i);
          }

          _vec.applyMat4(object.matrixWorld);
          this.expandCoord(_vec);
        }
      } else {
        if (object.boundingBox !== undefined) {
          if (object.boundingBox === null) object.computeBoundingBox!();
          _box.from(object.boundingBox!);
        } else {
          if (geometry.boundingBox === null) geometry.computeBoundingBox();
          _box.from(geometry.boundingBox!);
        }

        _box.applyMat4(object!.matrixWorld!);

        this.union(_box);
      }
    }

    const children = object.children;
    for (let i = 0, l = children.length; i < l; i++) {
      this.expandObject(children[i], precise);
    }

    return this;
  }

  containsVec(point: Const<Vec3>): boolean {
    return !(
      point.x < this.min.x ||
      point.x > this.max.x ||
      point.y < this.min.y ||
      point.y > this.max.y ||
      point.z < this.min.z ||
      point.z > this.max.z
    );
  }

  contains(box: Box3): boolean {
    return (
      this.min.x <= box.min.x &&
      box.max.x <= this.max.x &&
      this.min.y <= box.min.y &&
      box.max.y <= this.max.y &&
      this.min.z <= box.min.z &&
      box.max.z <= this.max.z
    );
  }

  intersects(box: Const<Box3>): boolean {
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

  intersectsSphere(sphere: Const<Sphere>): boolean {
    // Find the point on the AABB closest to the sphere center.
    const _vector = new Vec3();
    this.clamp(sphere.center, _vector);

    // If that point is inside the sphere, the AABB and sphere intersect.
    return _vector.distanceSqTo(sphere.center) <= sphere.radius * sphere.radius;
  }

  intersectsPlane(plane: Const<Plane>): boolean {
    // We compute the minimum and maximum dot product values. If those values
    // are on the same side (back or front) of the plane, then there is no intersection.

    let min: number;
    let max: number;
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

  intersectsTriangle(triangle: Const<Triangle>): boolean {
    if (this.isEmpty()) return false;

    const _center = this.center(_v9);
    const _extents = _v7.from(this.max).sub(_center);

    // translate triangle to aabb origin
    _v0.from(triangle.a).sub(_center);
    _v1.from(triangle.b).sub(_center);
    _v2.from(triangle.c).sub(_center);

    // compute edge vectors for triangle
    _v3.from(_v1).sub(_v0);
    _v4.from(_v2).sub(_v1);
    _v5.from(_v0).sub(_v2);

    // test against axes that are given by cross product combinations of the edges of the triangle and the edges of the aabb
    // make an axis testing of each of the 3 sides of the aabb against each of the 3 sides of the triangle = 9 axis of separation
    // axis_ij = u_i x f_j (u0, u1, u2 = face normals of aabb = x,y,z axes vectors since aabb is axis aligned)
    if (!validAxis(_axis.set(0, -_v3.z, _v3.y), _v0, _v1, _v2, _extents)) return false;
    if (!validAxis(_axis.set(0, -_v4.z, _v4.y), _v0, _v1, _v2, _extents)) return false;
    if (!validAxis(_axis.set(0, -_v5.z, _v5.y), _v0, _v1, _v2, _extents)) return false;
    if (!validAxis(_axis.set(_v3.z, 0, -_v3.x), _v0, _v1, _v2, _extents)) return false;
    if (!validAxis(_axis.set(_v4.z, 0, -_v4.x), _v0, _v1, _v2, _extents)) return false;
    if (!validAxis(_axis.set(_v5.z, 0, -_v5.x), _v0, _v1, _v2, _extents)) return false;
    if (!validAxis(_axis.set(-_v3.y, _v3.x, 0), _v0, _v1, _v2, _extents)) return false;
    if (!validAxis(_axis.set(-_v4.y, _v4.x, 0), _v0, _v1, _v2, _extents)) return false;
    if (!validAxis(_axis.set(-_v5.y, _v5.x, 0), _v0, _v1, _v2, _extents)) return false;
    if (!validAxis(_axis.set(1, 0, 0), _v0, _v1, _v2, _extents)) return false;
    if (!validAxis(_axis.set(0, 1, 0), _v0, _v1, _v2, _extents)) return false;
    if (!validAxis(_axis.set(0, 0, 1), _v0, _v1, _v2, _extents)) return false;
    return validAxis(_axis.from(_v3).cross(_v4), _v0, _v1, _v2, _extents);
  }

  clamp(vec: Const<Vec3>, into: Vec3 = Vec3.new()): Vec3 {
    return into.from(vec).clamp(this.min, this.max);
  }

  distanceTo(vec: Const<Vec3>): number {
    return this.clamp(vec, new Vec3(0, 0, 0)).distanceTo(vec);
  }

  sphere(into: Sphere = Sphere.new()): Sphere {
    if (this.isEmpty()) return into.clear();
    this.center(into.center);
    into.radius = this.size(_v1).length() * 0.5;

    return into;
  }

  intersect(box: Const<Box3>): this {
    this.min.max(box.min);
    this.max.min(box.max);

    if (this.isEmpty()) this.clear();

    return this;
  }

  union(box: Const<Box3>): this {
    this.min.min(box.min);
    this.max.max(box.max);

    return this;
  }

  applyMat4(mat: Const<Matrix4>): this {
    if (this.isEmpty()) return this;

    const { min, max } = _box.from(this);

    this.clear();
    this.expandCoord(_v1.set(min.x, min.y, min.z).applyMat4(mat));
    this.expandCoord(_v1.set(min.x, min.y, max.z).applyMat4(mat));
    this.expandCoord(_v1.set(min.x, max.y, min.z).applyMat4(mat));
    this.expandCoord(_v1.set(min.x, max.y, max.z).applyMat4(mat));
    this.expandCoord(_v1.set(max.x, min.y, min.z).applyMat4(mat));
    this.expandCoord(_v1.set(max.x, min.y, max.z).applyMat4(mat));
    this.expandCoord(_v1.set(max.x, max.y, min.z).applyMat4(mat));
    this.expandCoord(_v1.set(max.x, max.y, max.z).applyMat4(mat));

    return this;
  }

  translate(offset: Const<Vec3>): this {
    this.min.add(offset);
    this.max.add(offset);

    return this;
  }

  equals(box: Const<Box3>): boolean {
    return box.min.equals(this.min) && box.max.equals(this.max);
  }
}

Box3.prototype.isBox3 = true;

function validAxis(
  axis: Const<Vec3>,
  v0: Const<Vec3>,
  v1: Const<Vec3>,
  v2: Const<Vec3>,
  extents: Const<Vec3>,
): boolean {
  // project the aabb onto the separating axis
  const r = extents.x * Math.abs(axis.x) + extents.y * Math.abs(axis.y) + extents.z * Math.abs(axis.z);

  const p0 = v0.dot(axis);
  const p1 = v1.dot(axis);
  const p2 = v2.dot(axis);

  return Math.max(-Math.max(p0, p1, p2), Math.min(p0, p1, p2)) <= r;
}

const _axis = Vec3.new();

const isMesh = (obj: any): obj is Mesh => obj.isMesh;

const _v0 = Vec3.new();
const _v1 = Vec3.new();
const _v2 = Vec3.new();
const _v3 = Vec3.new();
const _v4 = Vec3.new();
const _v5 = Vec3.new();
const _v7 = Vec3.new();
const _v9 = Vec3.new();
const _box = Box3.new();

export interface Box3_ {
  min: IVec3;
  max: IVec3;
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

  export const size = (self: Const<Box3_>): IVec3 => size_(self, IVec3.empty());
  export const size_ = (self: Const<Box3_>, into: IVec3): IVec3 =>
    isEmpty(self)
      ? IVec3.set(into, 0, 0, 0)
      : IVec3.set(into, self.max.x - self.min.x, self.max.y - self.min.y, self.max.z - self.min.z);

  export const center = (self: Const<Box3_>): IVec3 => center_(self, IVec3.empty());
  export const center_ = (self: Const<Box3_>, into: IVec3): IVec3 =>
    isEmpty(self)
      ? IVec3.set(into, 0, 0, 0)
      : IVec3.set(into, (self.min.x + self.max.x) / 2, (self.min.y + self.max.y) / 2, (self.min.z + self.max.z) / 2);

  export const expandCoord = (self: Box3_, coord: Const<IVec3>): Box3_ => {
    IVec3.min(self.min, coord);
    IVec3.max(self.max, coord);

    return self;
  };
  export const expandedCoord = (self: Const<Box3_>, vec: Const<IVec3>): Box3_ => expandCoord(clone(self), vec);

  export const expandCoords = (self: Box3_, vecs: Const<IVec3>[]): Box3_ => {
    for (let i = 0, it = vecs.length; i < it; ++i) expandCoord(self, vecs[i]);
    return self;
  };
  export const expandedCoords = (self: Const<Box3_>, vecs: Const<IVec3>[]): Box3_ => expandCoords(clone(self), vecs);

  export const expandVec = (self: Box3_, vec: Const<IVec3>): Box3_ => {
    IVec3.sub(self.min, vec);
    IVec3.add(self.max, vec);

    return self;
  };
  export const expandedVec = (self: Const<Box3_>, vec: Const<IVec3>): Box3_ => expandVec(clone(self), vec);

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
  const _vec1 = IVec3.empty();
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
            IVec3.fillAttribute(_vec1, positionAttribute, i);
          }

          IVec3.applyMat4(_vec1, object.matrixWorld);
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

  export const fromCenterAndRadius = (center: Const<IVec3>, radius: number): Box3_ =>
    fromCenterAndRadius_(center, radius, empty());
  export const fromCenterAndRadius_ = ({ x, y, z }: Const<IVec3>, radius: number, into: Box3_): Box3_ =>
    set(into, x - radius, y - radius, z - radius, x + radius, y + radius, z + radius);
  export const fillCenterAndRadius = (self: Box3_, center: Const<IVec3>, radius: number): Box3_ =>
    fromCenterAndRadius_(center, radius, self);

  export const fromCoords = (vecs: Const<IVec3>[]): Box3_ => fromCoords_(vecs, empty());
  export const fromCoords_ = (vecs: Const<IVec3>[], into: Box3_): Box3_ => expandCoords(into, vecs);
  export const fillCoords = (self: Box3_, vecs: Const<IVec3>[]): Box3_ => fromCoords_(vecs, clear(self));

  export const fromCenterAndSize = (center: Const<IVec3>, size: Const<IVec3>): Box3_ =>
    fromCenterAndSize_(center, size, empty());
  export const fromCenterAndSize_ = (center: Const<IVec3>, size: Const<IVec3>, into: Box3_): Box3_ => {
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
  export const fillCenterAndSize = (self: Box3_, center: Const<IVec3>, size: Const<IVec3>): Box3_ =>
    fromCenterAndSize_(center, size, self);

  export const fromAttribute = (attribute: BufferAttribute): Box3_ => fromAttribute_(attribute, empty());
  export const fromAttribute_ = (attribute: BufferAttribute, into: Box3_): Box3_ => {
    Box3_.clear(into);

    for (let i = 0; i < attribute.count; ++i) {
      expandCoord(into, IVec3.fillAttribute(IVec3.temp0, attribute, i));
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

  export const containsVec = (self: Const<Box3_>, { x, y, z }: Const<IVec3>): boolean =>
    !(x < self.min.x || x > self.max.x || y < self.min.y || y > self.max.y || z < self.min.z || z > self.max.z);

  export const intersects = (self: Const<Box3_>, box: Const<Box3_>): boolean =>
    box.max.x >= self.min.x &&
    box.min.x <= self.max.x &&
    box.max.y >= self.min.y &&
    box.min.y <= self.max.y &&
    box.max.z >= self.min.z &&
    box.min.z <= self.max.z;
  export const intersectsSphere = (self: Const<Box3_>, sphere: Const<Sphere_>): boolean => {
    const vec = clampVec_(self, sphere.center, IVec3.temp0);
    const distance = IVec3.distanceSqTo(vec, sphere.center);

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
    v0: Const<IVec3>,
    v1: Const<IVec3>,
    v2: Const<IVec3>,
    extents: Const<IVec3>,
  ): boolean => {
    for (let i = 0, j = axes.length - 3; i <= j; i += 3) {
      const _testAxis = IVec3.fromArray_(axes, i, IVec3.temp9);

      // project the aabb onto the separating axis
      const r =
        extents.x * Math.abs(_testAxis.x) + extents.y * Math.abs(_testAxis.y) + extents.z * Math.abs(_testAxis.z);

      // project all 3 vertices of the triangle onto the separating axis
      const p0 = IVec3.dot(v0, _testAxis);
      const p1 = IVec3.dot(v1, _testAxis);
      const p2 = IVec3.dot(v2, _testAxis);

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
    const _center = center_(self, IVec3.temp0);
    const _extents = IVec3.sub_(self.max, _center, IVec3.temp1);

    // translate triangle to aabb origin
    const _v0 = IVec3.sub_(triangle.a, _center, IVec3.temp2);
    const _v1 = IVec3.sub_(triangle.b, _center, IVec3.temp3);
    const _v2 = IVec3.sub_(triangle.c, _center, IVec3.temp4);

    // compute edge vectors for triangle
    const _f0 = IVec3.sub_(_v1, _v0, IVec3.temp5);
    const _f1 = IVec3.sub_(_v2, _v1, IVec3.temp6);
    const _f2 = IVec3.sub_(_v0, _v2, IVec3.temp7);

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
    const _triangleNormal = IVec3.cross_(_f0, _f1, IVec3.temp8);
    axes = [_triangleNormal.x, _triangleNormal.y, _triangleNormal.z];

    return isSatForAxes(axes, _v0, _v1, _v2, _extents);
  };

  export const clampVec = (self: Const<Box3_>, vec: Const<IVec3>): IVec3 => clampVec_(self, vec, IVec3.empty());
  export const clampVec_ = (self: Const<Box3_>, { x, y, z }: Const<IVec3>, into: IVec3): IVec3 => {
    into.x = clamp(x, self.min.x, self.max.x);
    into.y = clamp(y, self.min.y, self.max.y);
    into.z = clamp(z, self.min.z, self.max.z);

    return into;
  };

  export const intersect = (self: Box3_, box: Const<Box3_>): Box3_ => {
    IVec3.max(self.min, box.min);
    IVec3.min(self.max, box.max);

    if (isEmpty(self)) clear(self);

    return self;
  };
  export const intersected = (self: Const<Box3_>, box: Const<Box3_>): Box3_ => intersect(clone(self), box);

  export const union = (self: Box3_, box: Const<Box3_>): Box3_ => {
    IVec3.min(self.min, box.min);
    IVec3.max(self.max, box.max);

    return self;
  };
  export const united = (self: Const<Box3_>, box: Const<Box3_>): Box3_ => union(clone(self), box);

  export const translate = (self: Box3_, { x, y, z }: Const<IVec3>): Box3_ => {
    self.min.x += x;
    self.min.y += y;
    self.min.z += z;
    self.max.x += x;
    self.max.y += y;
    self.max.z += z;

    return self;
  };
  export const translated = (self: Const<Box3_>, vec: Const<IVec3>): Box3_ => translate(clone(self), vec);

  const _vec4 = IVec3.empty();
  export const sphere = (self: Const<Box3_>) => sphere_(self, Sphere_.empty());
  export const sphere_ = (self: Const<Box3_>, into: Sphere_): Sphere_ => {
    if (isEmpty(self)) return Sphere_.clear(into);

    center_(self, into.center);
    into.radius = IVec3.length(size_(self, _vec4)) * 0.5;

    return into;
  };

  const _vec2 = IVec3.empty();
  const _box1 = empty();
  export const applyMat4 = (self: Const<Box3_>, matrix: Const<Matrix4>): Box3_ => applyMat4_(self, matrix, self);
  export const applyMat4_ = (self: Const<Box3_>, matrix: Const<Matrix4>, into: Box3_): Box3_ => {
    if (isEmpty(self)) return clear(into);
    const { min, max } = fill_(_box1, self);
    clear(into);

    IVec3.set(_vec2, min.x, min.y, min.z);
    IVec3.applyMat4(_vec2, matrix);
    expandCoord(into, _vec2);

    IVec3.set(_vec2, min.x, min.y, max.z);
    IVec3.applyMat4(_vec2, matrix);
    expandCoord(into, _vec2);

    IVec3.set(_vec2, min.x, max.y, min.z);
    IVec3.applyMat4(_vec2, matrix);
    expandCoord(into, _vec2);

    IVec3.set(_vec2, min.x, max.y, max.z);
    IVec3.applyMat4(_vec2, matrix);
    expandCoord(into, _vec2);

    IVec3.set(_vec2, max.x, min.y, min.z);
    IVec3.applyMat4(_vec2, matrix);
    expandCoord(into, _vec2);

    IVec3.set(_vec2, max.x, min.y, max.z);
    IVec3.applyMat4(_vec2, matrix);
    expandCoord(into, _vec2);

    IVec3.set(_vec2, max.x, max.y, min.z);
    IVec3.applyMat4(_vec2, matrix);
    expandCoord(into, _vec2);

    IVec3.set(_vec2, max.x, max.y, max.z);
    IVec3.applyMat4(_vec2, matrix);
    expandCoord(into, _vec2);

    return into;
  };
  export const appliedMat4 = (self: Const<Box3_>, matrix: Const<Matrix4>): Box3_ => applyMat4_(self, matrix, empty());

  const _vec3 = IVec3.empty();
  export const distanceSqTo = (self: Const<Box3_>, vec: Const<IVec3>): number => {
    IVec3.clamp_(vec, self.min, self.max, _vec3);

    return IVec3.distanceSqTo(_vec3, vec);
  };
  export const distanceTo = (self: Const<Box3_>, vec: Const<IVec3>): number => Math.sqrt(distanceSqTo(self, vec));

  export const equals = (a: Const<Box3_>, b: Const<Box3_>): boolean =>
    IVec3.equals(a.min, b.min) && IVec3.equals(a.max, b.max);
}
