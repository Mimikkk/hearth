import { Vec3 } from './Vec3.js';
import type { Entity } from '../core/Entity.js';
import type { Triangle } from './Triangle.js';
import type { Plane } from './Plane.js';
import { Sphere } from './Sphere.js';
import type { Mat4 } from './Mat4.js';
import { Mesh } from '@modules/renderer/engine/entities/Mesh.js';
import { Const } from '@modules/renderer/engine/math/types.js';
import { NumberArray } from '@modules/renderer/engine/math/MathUtils.js';
import { Attribute } from '@modules/renderer/engine/core/Attribute.js';

export class Box3 {
  declare isBox3: true;

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

  static fromCenterAndSize(center: Const<Vec3>, size: Const<Vec3>, into: Box3 = Box3.new()): Box3 {
    return into.fromCenterAndSize(center, size);
  }

  static fromCoords(coords: Const<Vec3[]>, into: Box3 = Box3.new()): Box3 {
    return into.fromCoords(coords);
  }

  static fromAttribute(attribute: Attribute, into: Box3 = Box3.new()): Box3 {
    return into.fromAttribute(attribute);
  }

  static fromArray(array: Const<NumberArray>, into: Box3 = Box3.new()): Box3 {
    return into.fromArray(array);
  }

  static fromObject(object: Const<Entity>, precise: boolean = false, into: Box3 = Box3.new()): Box3 {
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

  fromArray(array: Const<NumberArray>): this {
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

  fromCoords(coords: Const<Vec3[]>): this {
    return this.clear().expandCoords(coords);
  }

  fromCenterAndSize(center: Const<Vec3>, size: Const<Vec3>): this {
    const half = _v1.from(size).scale(0.5);

    this.min.from(center).sub(half);
    this.max.from(center).add(half);

    return this;
  }

  fromObject(object: Const<Entity>, precise: boolean = false): this {
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

  expandCoords(coords: Const<Vec3[]>): this {
    for (let i = 0, il = coords.length; i < il; i++) {
      this.expandCoord(coords[i]);
    }

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

  expandObject(object: Const<Entity>, precise: boolean = false): this {
    object.updateWorldMatrix(false, false);

    const geometry = object.geometry;

    if (geometry) {
      const position = geometry.attributes.position;

      if (precise && position && !object.isInstancedMesh) {
        for (let i = 0, l = position.count; i < l; i++) {
          let _vec: Vec3 = Vec3.new();

          if (isMesh(object)) {
            object.getVertexPosition(i, _vec);
          } else {
            _vec.fromAttribute(position, i);
          }

          _vec.applyMat4(object.matrixWorld);
          this.expandCoord(_vec);
        }
      } else {
        if (object.boundBox !== undefined) {
          if (object.boundBox === null) object.calcBoundBox!();

          _box1.from(object.boundBox!);
        } else {
          if (geometry.boundBox === null) geometry.calcBoundBox();
          _box1.from(geometry.boundBox!);
        }

        _box1.applyMat4(object!.matrixWorld!);

        this.union(_box1);
      }
    }

    const children = object.children;
    for (let i = 0, l = children.length; i < l; i++) {
      this.expandObject(children[i], precise);
    }

    return this;
  }

  containsCoord(point: Const<Vec3>): boolean {
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

  intersectsBox(box: Const<Box3>): boolean {
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
    const _vector = Vec3.new();
    this.clamp(sphere.center, _vector);

    return _vector.distanceSqTo(sphere.center) <= sphere.radius * sphere.radius;
  }

  intersectsPlane(plane: Const<Plane>): boolean {
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

    _v0.from(triangle.a).sub(_center);
    _v1.from(triangle.b).sub(_center);
    _v2.from(triangle.c).sub(_center);

    _v3.from(_v1).sub(_v0);
    _v4.from(_v2).sub(_v1);
    _v5.from(_v0).sub(_v2);

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
    return this.clamp(vec, Vec3.new(0, 0, 0)).distanceTo(vec);
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

  applyMat4(mat: Const<Mat4>): this {
    if (this.isEmpty()) return this;

    const { min, max } = _box2.from(this);
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
const _box1 = Box3.new();
const _box2 = Box3.new();
